import { useCallback, useEffect, useMemo, useState } from 'react';
import { avaliarMentor, buscarSessoes, ErroApi, mudarStatus } from './api';
import { ModalAvaliacao } from './components/ModalAvaliacao';
import { SessaoCard } from './components/SessaoCard';
import { separarSessoes } from './lib/formato';
import { useAvaliacoes, useUsuario } from './lib/usuario';
import type { AcaoSessao, Sessao } from './types';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; sessoes: Sessao[] }
  | { tipo: 'erro'; mensagem: string };

type Aba = 'proximas' | 'historico';

interface Feedback {
  tipo: 'ok' | 'erro';
  mensagem: string;
}

const MENSAGENS: Record<AcaoSessao, string> = {
  aceitar: 'Sessão confirmada. O calouro já pode ver o horário.',
  recusar: 'Pedido recusado.',
  cancelar: 'Sessão cancelada.',
  concluir: 'Sessão concluída. Agora o calouro pode avaliar.',
};

export default function App() {
  const { id, usuario } = useUsuario();
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [aba, setAba] = useState<Aba>('proximas');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [emAndamento, setEmAndamento] = useState<string | null>(null);
  const [modal, setModal] = useState<Sessao | null>(null);
  const [versao, setVersao] = useState(0);
  const { foiAvaliada, marcarAvaliada } = useAvaliacoes(id);

  useEffect(() => {
    let ativo = true;
    setEstado({ tipo: 'carregando' });

    buscarSessoes(id)
      .then((dados) => {
        if (!ativo) return;
        const minhas = dados.itens.filter(
          (sessao) => sessao.mentorId === id || sessao.mentoradoId === id,
        );
        setEstado({ tipo: 'pronto', sessoes: minhas });
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        setEstado({
          tipo: 'erro',
          mensagem: erro instanceof ErroApi ? erro.message : 'Não foi possível carregar a agenda.',
        });
      });

    return () => {
      ativo = false;
    };
  }, [id, versao]);

  const sessoes = estado.tipo === 'pronto' ? estado.sessoes : [];
  const { proximas, historico } = useMemo(() => separarSessoes(sessoes), [sessoes]);
  const listadas = aba === 'proximas' ? proximas : historico;

  const notificar = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('veterano:sessoes-atualizadas', { detail: { usuarioId: id } }),
    );
  }, [id]);

  const executarAcao = useCallback(
    async (sessao: Sessao, acao: AcaoSessao) => {
      setEmAndamento(`${sessao.id}:${acao}`);
      setFeedback(null);
      try {
        await mudarStatus(sessao.id, id, acao);
        setFeedback({ tipo: 'ok', mensagem: MENSAGENS[acao] });
        notificar();
        setVersao((atual) => atual + 1);
      } catch (erro) {
        setFeedback({
          tipo: 'erro',
          mensagem:
            erro instanceof ErroApi
              ? erro.message
              : 'Não foi possível concluir a ação. Tente novamente.',
        });
      } finally {
        setEmAndamento(null);
      }
    },
    [id, notificar],
  );

  const enviarAvaliacao = useCallback(
    async (nota: number, comentario: string) => {
      if (!modal) return;
      try {
        await avaliarMentor(modal.mentorId, id, {
          sessaoId: modal.id,
          nota,
          comentario: comentario || undefined,
        });
        marcarAvaliada(modal.id);
        setModal(null);
        setFeedback({ tipo: 'ok', mensagem: 'Avaliação registrada. Obrigado pelo retorno.' });
        notificar();
        setVersao((atual) => atual + 1);
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 409) {
          // Já avaliada em outro dispositivo: alinha o controle local e encerra.
          marcarAvaliada(modal.id);
          setModal(null);
          setFeedback({
            tipo: 'ok',
            mensagem: 'Essa sessão já tinha avaliação registrada. Sincronizamos seu histórico.',
          });
          return;
        }
        throw erro;
      }
    },
    [id, marcarAvaliada, modal, notificar],
  );

  const fecharModal = useCallback(() => setModal(null), []);

  return (
    <div className="mfe">
      <header className="mfe-cabecalho">
        <div>
          <p className="sobrescrito">Agenda</p>
          <h1>Sua agenda de mentoria</h1>
          <p className="texto-apoio">
            {usuario.papel === 'mentor'
              ? 'Aceite pedidos, conduza as sessões e conclua para liberar a avaliação.'
              : 'Acompanhe os pedidos que você enviou e avalie o mentor depois da sessão.'}
          </p>
        </div>
        <span className="usuario-chip">
          {usuario.nome} · {usuario.papel === 'mentor' ? 'mentor' : 'calouro'}
        </span>
      </header>

      {feedback ? (
        <div className={`feedback feedback-${feedback.tipo}`} role="status">
          <p>{feedback.mensagem}</p>
          <button type="button" className="fechar-feedback" onClick={() => setFeedback(null)}>
            Fechar
          </button>
        </div>
      ) : null}

      <div className="abas" role="tablist" aria-label="Filtrar sessões">
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'proximas'}
          className={aba === 'proximas' ? 'aba ativa' : 'aba'}
          onClick={() => setAba('proximas')}
        >
          Próximas
          <span className="aba-contagem">{proximas.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === 'historico'}
          className={aba === 'historico' ? 'aba ativa' : 'aba'}
          onClick={() => setAba('historico')}
        >
          Histórico
          <span className="aba-contagem">{historico.length}</span>
        </button>
      </div>

      {estado.tipo === 'carregando' ? (
        <div className="lista-sessoes" aria-busy="true" aria-label="Carregando sessões">
          {Array.from({ length: 3 }, (_, indice) => (
            <div key={indice} className="sessao esqueleto-sessao" aria-hidden="true">
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : null}

      {estado.tipo === 'erro' ? (
        <section className="cartao estado-erro" role="alert">
          <p className="sobrescrito">Falha de conexão</p>
          <h2>A agenda não carregou</h2>
          <p className="texto-apoio">{estado.mensagem}</p>
          <button
            type="button"
            className="botao botao-primario"
            onClick={() => setVersao((atual) => atual + 1)}
          >
            Tentar novamente
          </button>
        </section>
      ) : null}

      {estado.tipo === 'pronto' && listadas.length === 0 ? (
        <div className="vazio" role="tabpanel">
          <p>{aba === 'proximas' ? 'Nenhuma sessão marcada.' : 'Nada no histórico ainda.'}</p>
          <p className="texto-apoio">
            {aba === 'proximas'
              ? usuario.papel === 'mentor'
                ? 'Quando um calouro pedir ajuda, o pedido aparece aqui para você aceitar ou recusar.'
                : 'Encontre um mentor na aba Mentores e proponha um horário.'
              : 'Sessões concluídas, recusadas e canceladas aparecem nesta aba.'}
          </p>
        </div>
      ) : null}

      {estado.tipo === 'pronto' && listadas.length > 0 ? (
        <div className="lista-sessoes" role="tabpanel">
          {listadas.map((sessao) => (
            <SessaoCard
              key={sessao.id}
              sessao={sessao}
              usuarioId={id}
              avaliada={foiAvaliada(sessao.id)}
              processando={emAndamento?.startsWith(`${sessao.id}:`) ?? false}
              aoAcao={executarAcao}
              aoAvaliar={setModal}
            />
          ))}
        </div>
      ) : null}

      {modal ? (
        <ModalAvaliacao
          sessao={modal}
          aoFechar={fecharModal}
          aoEnviar={enviarAvaliacao}
          erroExterno={null}
        />
      ) : null}
    </div>
  );
}
