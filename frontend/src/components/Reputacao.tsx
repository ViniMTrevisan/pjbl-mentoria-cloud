import type { Reputacao as TipoReputacao } from '../types';

/** RF11 - mentor sem avaliacao nao exibe 0.0. */
export function Reputacao({ reputacao }: { reputacao: TipoReputacao }) {
  if (reputacao.media === null) {
    return (
      <div className="reputacao">
        <span className="nota-vazia">Sem avaliacoes<br />ainda</span>
      </div>
    );
  }
  return (
    <div className="reputacao">
      <span className="nota">{reputacao.media.toFixed(1)}</span>
      <span className="rotulo">{reputacao.total} avaliacao{reputacao.total > 1 ? 'es' : ''}</span>
    </div>
  );
}
