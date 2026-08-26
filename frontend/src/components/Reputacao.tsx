import type { Reputacao as TipoReputacao } from '../types';

/** RF11 — mentor sem avaliação não exibe 0.0. */
export function Reputacao({ reputacao }: { reputacao: TipoReputacao }) {
  if (reputacao.media === null) {
    return (
      <div className="reputacao">
        <span className="nota-vazia">Sem avaliações<br />ainda</span>
      </div>
    );
  }
  return (
    <div className="reputacao">
      <span className="nota">{reputacao.media.toFixed(1)}</span>
      <span className="rotulo">
        {reputacao.total} {reputacao.total === 1 ? 'avaliação' : 'avaliações'}
      </span>
    </div>
  );
}
