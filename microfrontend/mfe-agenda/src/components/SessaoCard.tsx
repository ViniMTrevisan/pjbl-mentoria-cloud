import { useState } from 'react';
import { blocoDeData, formatarData, statusLabel } from '../lib/formato';
import type { AcaoSessao, Sessao } from '../types';

interface Props {
  sessao: Sessao;
  usuarioId: string;
  avaliada: boolean;
  processando: boolean;
  aoAcao: (sessao: Sessao, acao: AcaoSessao) => void;
  aoAvaliar: (sessao: Sessao) => void;
}

export function SessaoCard({ sessao, usuarioId, avaliada, processando, aoAcao, aoAvaliar }: Props) {
  const [confirmando, setConfirmando] = useState<AcaoSessao | null>(null);
  const bloco = blocoDeData(sessao.dataHora);
  const souMentor = sessao.mentorId === usuarioId;
  const souMentorado = sessao.mentoradoId === usuarioId;
  const outro = souMentor ? sessao.mentoradoNome : sessao.mentorNome;

  const podeAceitar = sessao.status === 'SOLICITADA' && souMentor;
  const podeRecusar = sessao.status === 'SOLICITADA' && souMentor;
  const podeCancelar =
    (sessao.status === 'SOLICITADA' || sessao.status === 'ACEITA') && (souMentor || souMentorado);
  const podeConcluir = sessao.status === 'ACEITA' && (souMentor || souMentorado);
  const podeAvaliar = sessao.status === 'CONCLUIDA' && souMentorado && !avaliada;

  const temAcoes = podeAceitar || podeRecusar || podeCancelar || podeConcluir || podeAvaliar;

  function acionar(acao: AcaoSessao) {
    if (acao === 'cancelar' || acao === 'recusar') {
      if (confirmando !== acao) {
        setConfirmando(acao);
        return;
      }
      setConfirmando(null);
    }
    aoAcao(sessao, acao);
  }

  return (
    <article className={`sessao ${sessao.status.toLowerCase()}`}>
      <div className="sessao-data" aria-hidden="true">
        <strong>{bloco.dia}</strong>
        <span>{bloco.mes}</span>
        <small>{bloco.semana}</small>
      </div>

      <div className="sessao-corpo">
        <div className="sessao-topo">
          <div>
            <h3>{sessao.assunto}</h3>
            <p className="sessao-meta">
              {souMentor ? 'Calouro' : 'Mentor'}: {outro} · {formatarData(sessao.dataHora)}
            </p>
          </div>
          <span className={`selo-status s-${sessao.status.toLowerCase()}`}>
            {statusLabel(sessao.status)}
          </span>
        </div>

        <p className="sessao-papel">
          {souMentor ? 'Você é o mentor desta sessão.' : 'Você é o mentorado nesta sessão.'}
          {sessao.status === 'CONCLUIDA' && souMentorado
            ? avaliada
              ? ' Avaliação registrada.'
              : ' Sua avaliação ajuda os próximos calouros.'
            : ''}
        </p>

        {temAcoes ? (
          <div className="sessao-acoes">
            {podeAceitar ? (
              <button
                type="button"
                className="botao botao-primario"
                onClick={() => acionar('aceitar')}
                disabled={processando}
              >
                {processando ? 'Enviando…' : 'Aceitar'}
              </button>
            ) : null}

            {podeRecusar ? (
              <button
                type="button"
                className={confirmando === 'recusar' ? 'botao botao-perigo' : 'botao botao-secundario'}
                onClick={() => acionar('recusar')}
                disabled={processando}
              >
                {confirmando === 'recusar' ? 'Confirmar recusa' : 'Recusar'}
              </button>
            ) : null}

            {podeConcluir ? (
              <button
                type="button"
                className="botao botao-secundario"
                onClick={() => acionar('concluir')}
                disabled={processando}
              >
                {processando ? 'Enviando…' : 'Marcar como concluída'}
              </button>
            ) : null}

            {podeCancelar ? (
              <button
                type="button"
                className={confirmando === 'cancelar' ? 'botao botao-perigo' : 'botao botao-secundario'}
                onClick={() => acionar('cancelar')}
                disabled={processando}
              >
                {confirmando === 'cancelar' ? 'Confirmar cancelamento' : 'Cancelar'}
              </button>
            ) : null}

            {podeAvaliar ? (
              <button type="button" className="botao botao-primario" onClick={() => aoAvaliar(sessao)}>
                Avaliar mentor
              </button>
            ) : null}

            {confirmando ? (
              <button
                type="button"
                className="botao botao-texto"
                onClick={() => setConfirmando(null)}
                disabled={processando}
              >
                Voltar
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
