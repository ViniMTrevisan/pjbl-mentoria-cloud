import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obterMentor } from '../api';
import type { MentorDetalhado } from '../types';
import { GradeDisponibilidade } from '../components/GradeDisponibilidade';
import { Reputacao } from '../components/Reputacao';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Tela 2 (RF5 + RF11) - perfil publico do mentor. Consome GET /api/mentores/{id}. */
export function MentorDetalhe() {
  const { id = '' } = useParams();
  const [mentor, setMentor] = useState<MentorDetalhado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    obterMentor(id)
      .then(setMentor)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) return <div className="estado">Carregando perfil...</div>;

  if (erro || !mentor) {
    return (
      <div className="estado erro">
        <strong>Perfil indisponível.</strong>
        {erro ?? 'Mentor não encontrado.'}
      </div>
    );
  }

  return (
    <>
      <Link className="voltar" to="/">&larr; voltar para a busca</Link>

      <div className="painel">
        <div className="colunas">
          <div>
            <span className="rotulo">{mentor.curso} &middot; {mentor.periodo}º período</span>
            <h1 className="titulo-secao">{mentor.nome}</h1>
            <p className="linha-fina" style={{ marginBottom: 16 }}>{mentor.bio}</p>
            <div className="materias">
              {mentor.areas.map((area) => (
                <span className="materia" key={area.id}>{area.materia}</span>
              ))}
            </div>
          </div>
          <Reputacao reputacao={mentor.reputacao} />
        </div>
      </div>

      <div className="colunas">
        <div className="painel">
          <h2>Horários livres</h2>
          <GradeDisponibilidade disponibilidades={mentor.disponibilidades} />
          <div className="horarios" style={{ marginTop: 16 }}>
            {mentor.disponibilidades.map((d) => (
              <div className="horario" key={d.id}>
                <span>{DIAS[d.diaSemana]}</span>
                <span>{d.horaInicio} &ndash; {d.horaFim}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="painel">
          <h2>O que dizem</h2>
          {mentor.avaliacoes.length === 0 ? (
            <p className="linha-fina" style={{ margin: 0 }}>
              Ninguém avaliou esse mentor ainda. Você pode ser o primeiro.
            </p>
          ) : (
            mentor.avaliacoes.map((a, i) => (
              <div className="avaliacao" key={i}>
                <p>&ldquo;{a.comentario}&rdquo;</p>
                <span className="rotulo">{a.autor} &middot; nota {a.nota}/5</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
