import type { Mentor } from '../types';
import { diaDaSemana, mediaFormatada } from '../lib/formato';

interface Props {
  mentor: Mentor;
  aoAbrir: (mentor: Mentor) => void;
}

export function MentorCard({ mentor, aoAbrir }: Props) {
  const disponibilidades = [...mentor.disponibilidades].sort(
    (a, b) => a.diaSemana - b.diaSemana,
  );
  const media = mentor.reputacao?.media ?? null;
  const total = mentor.reputacao?.total ?? 0;

  return (
    <article className="mentor-card">
      <header className="mentor-topo">
        <div>
          <h3 className="mentor-nome">{mentor.nome}</h3>
          <p className="mentor-meta">
            {mentor.curso}
            {mentor.periodo ? ` · ${mentor.periodo}º período` : ''}
          </p>
        </div>
        {media === null ? (
          <span className="reputacao reputacao-vazia">Sem avaliações ainda</span>
        ) : (
          <span
            className="reputacao"
            title={`${total} avaliação${total === 1 ? '' : 'ões'}`}
          >
            <strong>{mediaFormatada(media)}</strong>
            <small>
              {total} avaliaç{total === 1 ? 'ão' : 'ões'}
            </small>
          </span>
        )}
      </header>

      {mentor.bio ? <p className="mentor-bio">{mentor.bio}</p> : null}

      <ul className="areas" aria-label="Áreas de mentoria">
        {mentor.areas.map((area) => (
          <li key={area.id} className="area">
            {area.materia}
          </li>
        ))}
      </ul>

      <div className="mentor-rodape">
        <div className="disponibilidades">
          <span className="rotulo-mini">Disponibilidade</span>
          {disponibilidades.length === 0 ? (
            <span className="texto-fraco">A combinar</span>
          ) : (
            <ul className="lista-horarios">
              {disponibilidades.slice(0, 2).map((item) => (
                <li key={item.id}>
                  {diaDaSemana(item.diaSemana).slice(0, 3)} {item.horaInicio}–{item.horaFim}
                </li>
              ))}
              {disponibilidades.length > 2 ? (
                <li className="texto-fraco">+{disponibilidades.length - 2}</li>
              ) : null}
            </ul>
          )}
        </div>

        <button type="button" className="botao botao-primario" onClick={() => aoAbrir(mentor)}>
          Ver horários
        </button>
      </div>
    </article>
  );
}
