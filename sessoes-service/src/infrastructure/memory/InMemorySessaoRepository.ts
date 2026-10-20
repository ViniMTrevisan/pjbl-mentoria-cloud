import type { EventoPendente, FiltroSessoes, Sessao } from '../../domain/sessao';
import type { OutboxRepository, SessaoRepository } from '../../ports/SessaoRepository';
import { clonarSessoesSeed } from '../seed/sessoesSeed';

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

/** Adaptador em memoria (dev/testes sem SQL Server), com outbox no mesmo objeto. */
export class InMemorySessaoRepository implements SessaoRepository, OutboxRepository {
  private readonly sessoes = new Map<string, Sessao>();
  private readonly outbox: EventoPendente[] = [];

  constructor(inicial: Sessao[] = clonarSessoesSeed()) {
    for (const sessao of inicial) this.sessoes.set(sessao.id, clonar(sessao));
  }

  async listar(filtro: FiltroSessoes): Promise<Sessao[]> {
    return Array.from(this.sessoes.values())
      .filter((sessao) => {
        if (
          filtro.usuarioId &&
          sessao.mentorId !== filtro.usuarioId &&
          sessao.mentoradoId !== filtro.usuarioId
        ) {
          return false;
        }
        if (filtro.status && sessao.status !== filtro.status) return false;
        return true;
      })
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
      .map(clonar);
  }

  async buscarPorId(id: string): Promise<Sessao | null> {
    const sessao = this.sessoes.get(id);
    return sessao ? clonar(sessao) : null;
  }

  async criar(sessao: Sessao, evento: EventoPendente): Promise<Sessao> {
    this.sessoes.set(sessao.id, clonar(sessao));
    this.outbox.push(clonar(evento));
    return clonar(sessao);
  }

  async atualizarStatus(
    id: string,
    statusEsperado: string,
    novoStatus: string,
    evento: EventoPendente,
    agora: string,
  ): Promise<Sessao | null> {
    const atual = this.sessoes.get(id);
    if (!atual || atual.status !== statusEsperado) return null;

    const atualizada: Sessao = {
      ...atual,
      status: novoStatus as Sessao['status'],
      atualizadaEm: agora,
    };
    this.sessoes.set(id, clonar(atualizada));
    this.outbox.push(clonar(evento));
    return clonar(atualizada);
  }

  async inserirVarios(sessoes: Sessao[]): Promise<void> {
    for (const sessao of sessoes) this.sessoes.set(sessao.id, clonar(sessao));
  }

  async contar(): Promise<number> {
    return this.sessoes.size;
  }

  async verificarSaude(): Promise<boolean> {
    return true;
  }

  async listarPendentes(limite: number): Promise<EventoPendente[]> {
    return this.outbox
      .filter((evento) => evento.publicadoEm === null)
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
      .slice(0, limite)
      .map(clonar);
  }

  async marcarPublicado(id: string, quando: string): Promise<void> {
    const evento = this.outbox.find((item) => item.id === id);
    if (evento) evento.publicadoEm = quando;
  }
}
