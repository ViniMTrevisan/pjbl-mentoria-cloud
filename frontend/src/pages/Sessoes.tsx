import { useEffect, useState } from 'react';
import { listarSessoes } from '../api';
import type { RespostaSessoes, Sessao } from '../types';

const formatarData = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));

const formatarHora = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));

function CartaoSessao({ sessao }: { sessao: Sessao }) {
  const classe = sessao.status.toLowerCase();
  return (
    <div className={`sessao ${classe}`}>
      <div className="sessao-data">
        <strong>{formatarData(sessao.dataHora)}</strong>
        {formatarHora(sessao.dataHora)}
      </div>
      <div>
        <h3>{sessao.assunto}</h3>
        <p>com {sessao.mentorNome}</p>
        {sessao.avaliacao && (
          <p className="nota-dada">voce avaliou {sessao.avaliacao.nota}/5 &mdash; &ldquo;{sessao.avaliacao.comentario}&rdquo;</p>
        )}
      </div>
      <span className={`selo ${classe}`}>{sessao.status}</span>
    </div>
  );
}

/** Tela 3 (RF9) - minhas sessoes. Consome GET /api/sessoes. */
export function Sessoes() {
  const [dados, setDados] = useState<RespostaSessoes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarSessoes()
      .then(setDados)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <div className="estado">Carregando suas sessoes...</div>;

  if (erro || !dados) {
    return (
      <div className="estado erro">
        <strong>Nao deu para carregar suas sessoes.</strong>
        {erro ?? 'Resposta vazia da API.'}
      </div>
    );
  }

  return (
    <>
      <h1 className="titulo-secao">Minhas sessoes</h1>
      <p className="linha-fina">
        Tudo que voce agendou, esperando resposta ou ja concluiu. {dados.total} registro(s) no total.
      </p>

      <h2 className="rotulo" style={{ display: 'block', marginBottom: 10 }}>Proximas</h2>
      {dados.proximas.length === 0 ? (
        <div className="estado" style={{ marginBottom: 32 }}>
          <strong>Nenhuma sessao agendada.</strong>
          Busque um mentor e escolha um horario livre.
        </div>
      ) : (
        <div className="lista" style={{ marginBottom: 32 }}>
          {dados.proximas.map((s) => <CartaoSessao sessao={s} key={s.id} />)}
        </div>
      )}

      <h2 className="rotulo" style={{ display: 'block', marginBottom: 10 }}>Historico</h2>
      <div className="lista">
        {dados.historico.map((s) => <CartaoSessao sessao={s} key={s.id} />)}
      </div>
    </>
  );
}
