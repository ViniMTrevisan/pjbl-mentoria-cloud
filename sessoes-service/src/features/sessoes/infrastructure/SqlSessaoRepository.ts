import sql from 'mssql';
import type {
  EventoPendente,
  FiltroSessoes,
  Sessao,
  SessaoStatus,
  TipoEvento,
} from '../domain/sessao';
import type { SessaoRepository } from '../application/SessaoRepository';
import type { OutboxRepository } from '../../outbox/application/OutboxRepository';
import { conectarComRetry, garantirBanco, mssqlConfig } from './connection';
import { SQL_SCHEMA, type SqlRepositoryConfig } from './schema';

interface LinhaSessao {
  id: string;
  mentorId: string;
  mentoradoId: string;
  mentorNome: string;
  mentoradoNome: string;
  dataHora: Date;
  assunto: string;
  status: string;
  criadaEm: Date;
  atualizadaEm: Date;
}

interface LinhaEvento {
  id: string;
  tipo: string;
  sessaoId: string;
  payload: string;
  criadoEm: Date;
  publicadoEm: Date | null;
}

const COLUNAS_SESSAO = `
  id, mentor_id AS mentorId, mentorado_id AS mentoradoId, mentor_nome AS mentorNome,
  mentorado_nome AS mentoradoNome, data_hora AS dataHora, assunto, status,
  criada_em AS criadaEm, atualizada_em AS atualizadaEm
`;

const COLUNAS_EVENTO = `
  id, tipo, sessao_id AS sessaoId, payload, criado_em AS criadoEm, publicado_em AS publicadoEm
`;

function toSessao(linha: LinhaSessao): Sessao {
  return {
    id: linha.id,
    mentorId: linha.mentorId,
    mentoradoId: linha.mentoradoId,
    mentorNome: linha.mentorNome,
    mentoradoNome: linha.mentoradoNome,
    dataHora: linha.dataHora.toISOString(),
    assunto: linha.assunto,
    status: linha.status as SessaoStatus,
    criadaEm: linha.criadaEm.toISOString(),
    atualizadaEm: linha.atualizadaEm.toISOString(),
  };
}

function toEvento(linha: LinhaEvento): EventoPendente {
  return {
    id: linha.id,
    tipo: linha.tipo as TipoEvento,
    sessaoId: linha.sessaoId,
    payload: linha.payload,
    criadoEm: linha.criadoEm.toISOString(),
    publicadoEm: linha.publicadoEm ? linha.publicadoEm.toISOString() : null,
  };
}

function prepararEvento(request: sql.Request, evento: EventoPendente): void {
  request.input('eventoId', sql.NVarChar(36), evento.id);
  request.input('eventoTipo', sql.NVarChar(40), evento.tipo);
  request.input('eventoSessaoId', sql.NVarChar(36), evento.sessaoId);
  request.input('eventoPayload', sql.NVarChar(sql.MAX), evento.payload);
  request.input('eventoCriadoEm', sql.DateTime2, new Date(evento.criadoEm));
}

async function inserirEvento(
  request: sql.Request,
  evento: EventoPendente,
): Promise<void> {
  prepararEvento(request, evento);
  await request.query(`
    INSERT INTO dbo.OUTBOX_EVENTO (id, tipo, sessao_id, payload, criado_em)
    VALUES (@eventoId, @eventoTipo, @eventoSessaoId, @eventoPayload, @eventoCriadoEm)
  `);
}

async function inserirSessao(request: sql.Request, sessao: Sessao): Promise<void> {
  request.input('id', sql.NVarChar(36), sessao.id);
  request.input('mentorId', sql.NVarChar(64), sessao.mentorId);
  request.input('mentoradoId', sql.NVarChar(64), sessao.mentoradoId);
  request.input('mentorNome', sql.NVarChar(120), sessao.mentorNome);
  request.input('mentoradoNome', sql.NVarChar(120), sessao.mentoradoNome);
  request.input('dataHora', sql.DateTime2, new Date(sessao.dataHora));
  request.input('assunto', sql.NVarChar(400), sessao.assunto);
  request.input('status', sql.NVarChar(20), sessao.status);
  request.input('criadaEm', sql.DateTime2, new Date(sessao.criadaEm));
  request.input('atualizadaEm', sql.DateTime2, new Date(sessao.atualizadaEm));

  await request.query(`
    INSERT INTO dbo.SESSAO
      (id, mentor_id, mentorado_id, mentor_nome, mentorado_nome, data_hora, assunto, status, criada_em, atualizada_em)
    VALUES
      (@id, @mentorId, @mentoradoId, @mentorNome, @mentoradoNome, @dataHora, @assunto, @status, @criadaEm, @atualizadaEm)
  `);
}

/** Adaptador Azure SQL / SQL Server. Pool lazy com retry e transacoes no outbox. */
export class SqlSessaoRepository implements SessaoRepository, OutboxRepository {
  private poolPromise: Promise<sql.ConnectionPool> | null = null;

  constructor(
    private readonly config: SqlRepositoryConfig,
    private readonly tentativas = 10,
    private readonly esperaMs = 2_000,
  ) {}

  private pool(): Promise<sql.ConnectionPool> {
    if (!this.poolPromise) {
      const tentativa = conectarComRetry(
        mssqlConfig(this.config),
        this.tentativas,
        this.esperaMs,
      );
      this.poolPromise = tentativa;
      tentativa.catch(() => {
        this.poolPromise = null;
      });
    }
    return this.poolPromise;
  }

  async inicializar(): Promise<void> {
    await garantirBanco(this.config);
    const pool = await this.pool();
    await pool.request().batch(SQL_SCHEMA);
  }

  async listar(filtro: FiltroSessoes): Promise<Sessao[]> {
    const pool = await this.pool();
    const request = pool.request();
    const condicoes: string[] = [];

    if (filtro.usuarioId) {
      condicoes.push('(mentor_id = @usuarioId OR mentorado_id = @usuarioId)');
      request.input('usuarioId', sql.NVarChar(64), filtro.usuarioId);
    }
    if (filtro.status) {
      condicoes.push('status = @status');
      request.input('status', sql.NVarChar(20), filtro.status);
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
    const resultado = await request.query<LinhaSessao>(`
      SELECT ${COLUNAS_SESSAO} FROM dbo.SESSAO ${where} ORDER BY data_hora ASC
    `);
    return resultado.recordset.map(toSessao);
  }

  async buscarPorId(id: string): Promise<Sessao | null> {
    const pool = await this.pool();
    const resultado = await pool
      .request()
      .input('id', sql.NVarChar(36), id)
      .query<LinhaSessao>(`SELECT ${COLUNAS_SESSAO} FROM dbo.SESSAO WHERE id = @id`);

    const linha = resultado.recordset[0];
    return linha ? toSessao(linha) : null;
  }

  async criar(sessao: Sessao, evento: EventoPendente): Promise<Sessao> {
    const pool = await this.pool();
    const transacao = new sql.Transaction(pool);
    await transacao.begin();
    try {
      await inserirSessao(new sql.Request(transacao), sessao);
      await inserirEvento(new sql.Request(transacao), evento);
      await transacao.commit();
      return sessao;
    } catch (erro) {
      await transacao.rollback().catch(() => undefined);
      throw erro;
    }
  }

  async atualizarStatus(
    id: string,
    statusEsperado: string,
    novoStatus: string,
    evento: EventoPendente,
    agora: string,
  ): Promise<Sessao | null> {
    const pool = await this.pool();
    const transacao = new sql.Transaction(pool);
    await transacao.begin();

    try {
      const request = new sql.Request(transacao);
      request.input('id', sql.NVarChar(36), id);
      request.input('statusEsperado', sql.NVarChar(20), statusEsperado);
      request.input('novoStatus', sql.NVarChar(20), novoStatus);
      request.input('atualizadaEm', sql.DateTime2, new Date(agora));

      const resultado = await request.query(`
        UPDATE dbo.SESSAO
           SET status = @novoStatus, atualizada_em = @atualizadaEm
         WHERE id = @id AND status = @statusEsperado
      `);

      if (resultado.rowsAffected[0] === 0) {
        await transacao.rollback();
        return null;
      }

      await inserirEvento(new sql.Request(transacao), evento);
      await transacao.commit();
    } catch (erro) {
      await transacao.rollback().catch(() => undefined);
      throw erro;
    }

    return this.buscarPorId(id);
  }

  async inserirVarios(sessoes: Sessao[]): Promise<void> {
    if (sessoes.length === 0) return;
    const pool = await this.pool();
    const transacao = new sql.Transaction(pool);
    await transacao.begin();
    try {
      for (const sessao of sessoes) {
        await inserirSessao(new sql.Request(transacao), sessao);
      }
      await transacao.commit();
    } catch (erro) {
      await transacao.rollback().catch(() => undefined);
      throw erro;
    }
  }

  async contar(): Promise<number> {
    const pool = await this.pool();
    const resultado = await pool
      .request()
      .query<{ total: number }>('SELECT COUNT(1) AS total FROM dbo.SESSAO');
    return resultado.recordset[0]?.total ?? 0;
  }

  async verificarSaude(): Promise<boolean> {
    try {
      const pool = await this.pool();
      await pool.request().query('SELECT 1 AS ok');
      return true;
    } catch {
      return false;
    }
  }

  async listarPendentes(limite: number): Promise<EventoPendente[]> {
    const pool = await this.pool();
    const resultado = await pool
      .request()
      .input('limite', sql.Int, limite)
      .query<LinhaEvento>(`
        SELECT TOP (@limite) ${COLUNAS_EVENTO}
          FROM dbo.OUTBOX_EVENTO
         WHERE publicado_em IS NULL
         ORDER BY criado_em ASC
      `);
    return resultado.recordset.map(toEvento);
  }

  async marcarPublicado(id: string, quando: string): Promise<void> {
    const pool = await this.pool();
    await pool
      .request()
      .input('id', sql.NVarChar(36), id)
      .input('publicadoEm', sql.DateTime2, new Date(quando))
      .query(`
        UPDATE dbo.OUTBOX_EVENTO
           SET publicado_em = @publicadoEm
         WHERE id = @id AND publicado_em IS NULL
      `);
  }

  async fechar(): Promise<void> {
    if (!this.poolPromise) return;
    const pool = await this.poolPromise.catch(() => null);
    this.poolPromise = null;
    if (pool) await pool.close();
  }
}
