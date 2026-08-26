import type { Disponibilidade } from '../types';

const SIGLAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NOMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
// Blocos de 2h cobrindo o dia letivo: 8h as 22h.
const BLOCOS = [8, 10, 12, 14, 16, 18, 20];

const paraMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

/** Grade horaria da semana com os blocos livres marcados (RF4). */
export function GradeDisponibilidade({ disponibilidades }: { disponibilidades: Disponibilidade[] }) {
  const estaLivre = (dia: number, blocoInicio: number) =>
    disponibilidades.some(
      (d) =>
        d.diaSemana === dia &&
        paraMinutos(d.horaInicio) < (blocoInicio + 2) * 60 &&
        paraMinutos(d.horaFim) > blocoInicio * 60,
    );

  const totalLivres = disponibilidades.length;

  return (
    <div>
      <div className="grade-semana" role="img" aria-label={`Disponibilidade semanal: ${totalLivres} bloco(s) de horario`}>
        {SIGLAS.map((sigla, dia) => (
          <div className="grade-dia" key={NOMES[dia]}>
            <span className="grade-sigla" aria-hidden="true">{sigla}</span>
            {BLOCOS.map((bloco) => (
              <span
                key={bloco}
                className={`grade-bloco${estaLivre(dia, bloco) ? ' livre' : ''}`}
                aria-hidden="true"
              />
            ))}
          </div>
        ))}
      </div>
      <p className="grade-legenda">
        {totalLivres > 0 ? `${totalLivres} bloco(s) livres na semana` : 'sem horarios cadastrados'}
      </p>
    </div>
  );
}
