import { useEffect, useRef, useState } from 'react';
import { formatarData } from '../lib/formato';
import type { Sessao } from '../types';

interface Props {
  sessao: Sessao;
  aoFechar: () => void;
  aoEnviar: (nota: number, comentario: string) => Promise<void>;
  erroExterno: string | null;
}

export function ModalAvaliacao({ sessao, aoFechar, aoEnviar, erroExterno }: Props) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fecharRef.current?.focus();
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar();
    };
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [aoFechar]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    if (nota < 1) {
      setErro('Escolha uma nota de 1 a 5.');
      return;
    }
    setEnviando(true);
    try {
      await aoEnviar(nota, comentario.trim());
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível enviar a avaliação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={aoFechar} role="presentation">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-avaliacao"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <div>
            <p className="sobrescrito">Avaliação</p>
            <h2 id="titulo-avaliacao">Como foi a sessão com {sessao.mentorNome}?</h2>
            <p className="texto-fraco">
              {sessao.assunto} · {formatarData(sessao.dataHora)}
            </p>
          </div>
          <button
            type="button"
            className="fechar"
            onClick={aoFechar}
            ref={fecharRef}
            aria-label="Fechar avaliação"
          >
            Fechar
          </button>
        </header>

        <form className="formulario" onSubmit={enviar}>
          <fieldset className="notas">
            <legend>Nota</legend>
            {[1, 2, 3, 4, 5].map((valor) => (
              <label key={valor} className={nota === valor ? 'nota-opcao ativa' : 'nota-opcao'}>
                <input
                  type="radio"
                  name="nota"
                  value={valor}
                  checked={nota === valor}
                  onChange={() => setNota(valor)}
                />
                <span>{valor}</span>
              </label>
            ))}
          </fieldset>
          <p className="texto-fraco">1 = não ajudou · 5 = resolveu o problema com folga.</p>

          <label className="campo">
            <span>Comentário (opcional)</span>
            <textarea
              value={comentario}
              onChange={(evento) => setComentario(evento.target.value)}
              rows={3}
              maxLength={280}
              placeholder="O que funcionou bem? O que o próximo calouro deveria saber?"
            />
            <small>{comentario.length}/280</small>
          </label>

          {erro || erroExterno ? (
            <p className="erro-form" role="alert">
              {erro ?? erroExterno}
            </p>
          ) : null}

          <div className="acoes-form">
            <button type="submit" className="botao botao-primario" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar avaliação'}
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
