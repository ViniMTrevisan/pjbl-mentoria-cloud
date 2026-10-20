import { useEffect, useRef, useState } from 'react';
import { criarSessao, ErroApi } from '../api';
import { diaDaSemana, formatarData } from '../lib/formato';
import type { Usuario } from '../lib/usuario';
import type { Mentor } from '../types';

interface Props {
  mentor: Mentor;
  usuario: Usuario;
  aoFechar: () => void;
  aoSolicitar: (mensagem: string) => void;
}

function valorLocalParaInput(data: Date): string {
  const pad = (numero: number) => String(numero).padStart(2, '0');
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(
    data.getHours(),
  )}:${pad(data.getMinutes())}`;
}

export function DetalheMentor({ mentor, usuario, aoFechar, aoSolicitar }: Props) {
  const [dataHora, setDataHora] = useState('');
  const [assunto, setAssunto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);

  const ehProprioMentor = usuario.id === mentor.id;
  const minimo = valorLocalParaInput(new Date(Date.now() + 5 * 60 * 1000));
  const disponibilidades = [...mentor.disponibilidades].sort((a, b) => a.diaSemana - b.diaSemana);

  useEffect(() => {
    fecharRef.current?.focus();

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar();
    };
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', aoTeclar);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [aoFechar]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!dataHora) {
      setErro('Escolha a data e o horário da sessão.');
      return;
    }
    const quando = new Date(dataHora);
    if (Number.isNaN(quando.getTime()) || quando.getTime() < Date.now()) {
      setErro('Escolha um horário no futuro.');
      return;
    }
    if (assunto.trim().length < 5) {
      setErro('Descreva o assunto com pelo menos 5 caracteres.');
      return;
    }
    if (ehProprioMentor) {
      setErro('Você está na visão de mentor. Troque de usuário para solicitar uma sessão.');
      return;
    }

    setEnviando(true);
    try {
      const sessao = await criarSessao(usuario.id, {
        mentorId: mentor.id,
        mentoradoId: usuario.id,
        mentorNome: mentor.nome,
        mentoradoNome: usuario.nome,
        dataHora: quando.toISOString(),
        assunto: assunto.trim(),
      });
      window.dispatchEvent(
        new CustomEvent('veterano:sessoes-atualizadas', {
          detail: { sessaoId: sessao.id, usuarioId: usuario.id },
        }),
      );
      aoSolicitar(
        `Pedido enviado para ${mentor.nome} em ${formatarData(quando.toISOString())}. Acompanhe a resposta em Sessões.`,
      );
    } catch (falha) {
      setErro(
        falha instanceof ErroApi ? falha.message : 'Não foi possível enviar o pedido. Tente de novo.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="drawer-overlay" onClick={aoFechar} role="presentation">
      <section
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalhe"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="drawer-cabecalho">
          <div>
            <p className="sobrescrito">Perfil do mentor</p>
            <h2 id="titulo-detalhe">{mentor.nome}</h2>
            <p className="texto-fraco">
              {mentor.curso}
              {mentor.periodo ? ` · ${mentor.periodo}º período` : ''}
            </p>
          </div>
          <button
            type="button"
            className="fechar"
            onClick={aoFechar}
            ref={fecharRef}
            aria-label="Fechar detalhes"
          >
            Fechar
          </button>
        </header>

        {mentor.bio ? <p className="drawer-bio">{mentor.bio}</p> : null}

        <div className="bloco">
          <h3 className="bloco-titulo">Áreas</h3>
          <ul className="areas">
            {mentor.areas.map((area) => (
              <li key={area.id} className="area">
                {area.materia}
                <small>{area.curso}</small>
              </li>
            ))}
          </ul>
        </div>

        <div className="bloco">
          <h3 className="bloco-titulo">Grade de horários</h3>
          {disponibilidades.length === 0 ? (
            <p className="texto-fraco">
              Sem horários fixos. Proponha um horário abaixo e combine com o mentor.
            </p>
          ) : (
            <ul className="grade-horarios">
              {disponibilidades.map((item) => (
                <li key={item.id} className="horario">
                  <span>{diaDaSemana(item.diaSemana)}</span>
                  <strong>
                    {item.horaInicio}–{item.horaFim}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="formulario" onSubmit={enviar}>
          <h3 className="bloco-titulo">Solicitar sessão</h3>

          {ehProprioMentor ? (
            <p className="aviso-inline">
              Você está vendo o portal como mentor. Para pedir uma sessão, troque para um usuário
              calouro no seletor do shell.
            </p>
          ) : null}

          <label className="campo">
            <span>Data e horário</span>
            <input
              type="datetime-local"
              value={dataHora}
              min={minimo}
              onChange={(evento) => setDataHora(evento.target.value)}
              required
            />
            <small>Horário local do seu navegador.</small>
          </label>

          <label className="campo">
            <span>Assunto</span>
            <textarea
              value={assunto}
              onChange={(evento) => setAssunto(evento.target.value)}
              rows={3}
              maxLength={280}
              placeholder="Ex.: dúvida em árvores binárias, exercício 4 da lista."
              required
            />
            <small>{assunto.length}/280 · seja específico para o mentor se preparar.</small>
          </label>

          {erro ? (
            <p className="erro-form" role="alert">
              {erro}
            </p>
          ) : null}

          <div className="acoes-form">
            <button type="submit" className="botao botao-primario" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar pedido'}
            </button>
            <button type="button" className="botao botao-secundario" onClick={aoFechar}>
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
