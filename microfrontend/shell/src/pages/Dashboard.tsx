import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { buscarAgregado, ErroApi } from '../api';
import { EsqueletoPagina } from '../components/Esqueleto';
import { blocoDeData, formatarData, statusLabel } from '../lib/formato';
import { separarSessoes } from '../lib/sessoes';
import type { Usuario } from '../lib/usuario';
import type { Agregado, Mentor } from '../types';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; dados: Agregado }
  | { tipo: 'erro'; mensagem: string };

const NOMES_DEPENDENCIA: Record<string, string> = {
  mentores: 'Serviço de mentores',
  sessoes: 'Serviço de sessões',
  reputacao: 'Cálculo de reputação',
};

export function Dashboard({ usuario }: { usuario: Usuario }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [versao, setVersao] = useState(0);

  const carregar = useCallback(() => {
    setVersao((atual) => atual + 1);
  }, []);

  useEffect(() => {
    let ativo = true;
    setEstado({ tipo: 'carregando' });

    buscarAgregado(usuario.id)
      .then((dados) => {
        if (ativo) setEstado({ tipo: 'pronto', dados });
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        const mensagem =
          erro instanceof ErroApi ? erro.message : 'Não foi possível carregar o dashboard.';
        setEstado({ tipo: 'erro', mensagem });
      });

    return () => {
      ativo = false;
    };
  }, [usuario.id, versao]);

  useEffect(() => {
    const aoAtualizar = () => carregar();
    window.addEventListener('veterano:sessoes-atualizadas', aoAtualizar);
    return () => {
      window.removeEventListener('veterano:sessoes-atualizadas', aoAtualizar);
    };
  }, [carregar]);

  const proximas = useMemo(() => {
    if (estado.tipo !== 'pronto') return [];
    const todas = [...estado.dados.sessoes.proximas, ...estado.dados.sessoes.historico];
    const { proximas: futuras } = separarSessoes(todas);
    return futuras.slice(0, 4);
  }, [estado]);

  const topMentores = useMemo(() => {
    if (estado.tipo !== 'pronto') return [];
    return [...estado.dados.mentores]
      .filter((mentor) => typeof mentor.reputacao?.media === 'number')
      .sort((a, b) => (b.reputacao?.media ?? 0) - (a.reputacao?.media ?? 0))
      .slice(0, 4);
  }, [estado]);

  if (estado.tipo === 'carregando') {
    return (
      <div className="pagina">
        <Cabecalho usuario={usuario} />
        <EsqueletoPagina />
      </div>
    );
  }

  if (estado.tipo === 'erro') {
    return (
      <div className="pagina">
        <Cabecalho usuario={usuario} />
        <section className="cartao estado-erro" role="alert">
          <p className="sobrescrito">Falha de conexão</p>
          <h2>O dashboard não carregou</h2>
          <p className="texto-apoio">{estado.mensagem}</p>
          <button type="button" className="botao botao-primario" onClick={carregar}>
            Tentar novamente
          </button>
        </section>
      </div>
    );
  }

  const { dados } = estado;
  const { resumo } = dados;

  return (
    <div className="pagina">
      <Cabecalho usuario={usuario} />

      {dados.parcial ? (
        <section className="aviso aviso-parcial" role="status">
          <strong>Dados parciais.</strong>{' '}
          {dados.falhas.length > 0
            ? `${dados.falhas.map((falha) => NOMES_DEPENDENCIA[falha] ?? falha).join(', ')} não respondeu a tempo.`
            : 'Algumas dependências não responderam a tempo.'}{' '}
          O restante da tela foi carregado normalmente.
        </section>
      ) : null}

      <section className="kpis" aria-label="Indicadores">
        <article className="cartao kpi">
          <span className="kpi-rotulo">Mentores ativos</span>
          <strong className="kpi-valor">{resumo.totalMentores}</strong>
          <span className="kpi-nota">veteranos com área cadastrada</span>
        </article>
        <article className="cartao kpi">
          <span className="kpi-rotulo">Sessões</span>
          <strong className="kpi-valor">{resumo.totalSessoes}</strong>
          <span className="kpi-nota">no seu histórico e agenda</span>
        </article>
        <article className={`cartao kpi ${resumo.sessoesPendentes > 0 ? 'kpi-destaque' : ''}`}>
          <span className="kpi-rotulo">Aguardando resposta</span>
          <strong className="kpi-valor">{resumo.sessoesPendentes}</strong>
          <span className="kpi-nota">
            {resumo.sessoesPendentes > 0 ? 'pedidos precisam de confirmação' : 'nada pendente'}
          </span>
        </article>
        <article className="cartao kpi">
          <span className="kpi-rotulo">Média de reputação</span>
          <strong className="kpi-valor">
            {resumo.mediaReputacao === null
              ? '—'
              : resumo.mediaReputacao.toFixed(1).replace('.', ',')}
          </strong>
          <span className="kpi-nota">
            {resumo.mediaReputacao === null ? 'ainda sem avaliações' : 'de 5,0 entre os mentores'}
          </span>
        </article>
      </section>

      <div className="colunas">
        <section className="cartao" aria-labelledby="titulo-proximas">
          <div className="cartao-cabecalho">
            <div>
              <p className="sobrescrito">Agenda</p>
              <h2 id="titulo-proximas">Próximas sessões</h2>
            </div>
            <Link className="link-acao" to="/sessoes">
              Ver agenda
            </Link>
          </div>

          {proximas.length === 0 ? (
            <div className="vazio">
              <p>Nenhuma sessão marcada.</p>
              <p className="texto-apoio">
                Encontre um veterano que já passou pela matéria e combine um horário.
              </p>
              <Link className="botao botao-secundario" to="/mentores">
                Encontrar mentor
              </Link>
            </div>
          ) : (
            <ul className="lista-sessoes">
              {proximas.map((sessao) => {
                const bloco = blocoDeData(sessao.dataHora);
                const outro = usuario.id === sessao.mentorId ? sessao.mentoradoNome : sessao.mentorNome;
                return (
                  <li key={sessao.id} className="linha-sessao">
                    <span className="data-bloco" aria-hidden="true">
                      <strong>{bloco.dia}</strong>
                      <small>{bloco.mes}</small>
                    </span>
                    <div className="linha-conteudo">
                      <p className="linha-titulo">{sessao.assunto}</p>
                      <p className="linha-meta">
                        com {outro} · {formatarData(sessao.dataHora)}
                      </p>
                    </div>
                    <span className={`selo-status s-${sessao.status.toLowerCase()}`}>
                      {statusLabel(sessao.status)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="cartao" aria-labelledby="titulo-top">
          <div className="cartao-cabecalho">
            <div>
              <p className="sobrescrito">Reputação</p>
              <h2 id="titulo-top">Top mentores</h2>
            </div>
            <Link className="link-acao" to="/mentores">
              Ver todos
            </Link>
          </div>

          {topMentores.length === 0 ? (
            <div className="vazio">
              <p>Ainda sem avaliações.</p>
              <p className="texto-apoio">
                Quando as primeiras sessões forem concluídas, o ranking aparece aqui.
              </p>
            </div>
          ) : (
            <ol className="ranking">
              {topMentores.map((mentor, indice) => (
                <li key={mentor.id} className="ranking-item">
                  <span className="ranking-posicao">{String(indice + 1).padStart(2, '0')}</span>
                  <div className="ranking-conteudo">
                    <p className="linha-titulo">{mentor.nome}</p>
                    <p className="linha-meta">{areaPrincipal(mentor)}</p>
                  </div>
                  <span className="nota" title={`${mentor.reputacao?.total ?? 0} avaliações`}>
                    {(mentor.reputacao?.media ?? 0).toFixed(1).replace('.', ',')}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="cartao saude" aria-labelledby="titulo-saude">
        <div className="cartao-cabecalho">
          <div>
            <p className="sobrescrito">Observabilidade</p>
            <h2 id="titulo-saude">Saúde da arquitetura</h2>
          </div>
          <span className={`selo ${dados.parcial ? 'selo-aviso' : 'selo-ok'}`}>
            {dados.parcial ? 'Resposta parcial' : 'Todas as dependências ok'}
          </span>
        </div>

        <ul className="dependencias">
          {(['mentores', 'sessoes', 'reputacao'] as const).map((chave) => {
            const fora = dados.falhas.includes(chave);
            return (
              <li key={chave} className={fora ? 'dependencia fora' : 'dependencia'}>
                <span className="ponto" aria-hidden="true" />
                <span>{NOMES_DEPENDENCIA[chave]}</span>
                <span className="dependencia-estado">{fora ? 'fora' : 'ok'}</span>
              </li>
            );
          })}
        </ul>

        <p className="texto-apoio">
          Agregado gerado em {formatarData(dados.geradoEm)} · visão de {usuario.nome} ·{' '}
          {dados.eventos.length} evento{dados.eventos.length === 1 ? '' : 's'} recente
          {dados.eventos.length === 1 ? '' : 's'}.
        </p>
      </section>
    </div>
  );
}

function Cabecalho({ usuario }: { usuario: Usuario }) {
  return (
    <header className="pagina-cabecalho">
      <p className="sobrescrito">Dashboard</p>
      <h1>
        {usuario.papel === 'mentor' ? 'Seus pedidos e sua reputação.' : 'Seu atalho para não travar.'}
      </h1>
      <p className="texto-apoio">
        {usuario.papel === 'mentor'
          ? 'Acompanhe o que os calouros pediram e mantenha suas áreas atualizadas.'
          : 'Acompanhe sessões, veja quem pode ajudar e escolha o horário que cabe na sua semana.'}
      </p>
    </header>
  );
}

function areaPrincipal(mentor: Mentor): string {
  const primeira = mentor.areas[0];
  if (!primeira) return mentor.curso;
  return `${primeira.materia} · ${mentor.curso}`;
}
