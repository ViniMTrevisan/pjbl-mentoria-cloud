import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarMentores } from '../api';
import type { Mentor } from '../types';
import { Reputacao } from '../components/Reputacao';

const MATERIAS_EM_ALTA = [
  'Estrutura de Dados',
  'Cálculo Diferencial e Integral',
  'Banco de Dados',
  'Redes de Computadores',
  'Arquitetura e Soluções em Cloud',
];

/** Tela 1 (RF5) - busca de mentores. Consome GET /api/mentores da Azure Function. */
export function Mentores() {
  const [q, setQ] = useState('');
  const [curso, setCurso] = useState('');
  const [materia, setMateria] = useState('');
  const [mentores, setMentores] = useState<Mentor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const filtros = useMemo(() => ({ q, curso, materia }), [q, curso, materia]);

  useEffect(() => {
    let cancelado = false;
    const tempo = setTimeout(() => {
      setCarregando(true);
      setErro(null);
      listarMentores(filtros)
        .then((dados) => { if (!cancelado) setMentores(dados.mentores); })
        .catch((e: Error) => { if (!cancelado) setErro(e.message); })
        .finally(() => { if (!cancelado) setCarregando(false); });
    }, 250);
    return () => { cancelado = true; clearTimeout(tempo); };
  }, [filtros]);

  const alternarMateria = (nome: string) => setMateria((atual) => (atual === nome ? '' : nome));

  return (
    <>
      <h1 className="titulo-secao">Quem já passou por essa matéria.</h1>
      <p className="linha-fina">
        Veteranos que se ofereceram para ajudar, com os horários que eles mesmos marcaram como livres.
        Filtre pela matéria que está te travando agora.
      </p>

      <div className="busca">
        <label className="campo">
          <span className="rotulo">Matéria</span>
          <input value={materia} onChange={(e) => setMateria(e.target.value)} placeholder="Banco de Dados" />
        </label>
        <label className="campo">
          <span className="rotulo">Curso</span>
          <input value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Engenharia de Software" />
        </label>
        <label className="campo">
          <span className="rotulo">Nome ou palavra-chave</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="react, monitoria, cálculo..." />
        </label>
      </div>

      <div className="atalhos">
        <span className="rotulo">Em alta:</span>
        {MATERIAS_EM_ALTA.map((nome) => (
          <button
            key={nome}
            type="button"
            className="chip"
            aria-pressed={materia === nome}
            onClick={() => alternarMateria(nome)}
          >
            {nome}
          </button>
        ))}
      </div>

      {erro && (
        <div className="estado erro">
          <strong>Não foi possível carregar os mentores.</strong>
          {erro}
        </div>
      )}

      {!erro && carregando && <div className="estado">Buscando mentores...</div>}

      {!erro && !carregando && mentores.length === 0 && (
        <div className="estado">
          <strong>Nenhum mentor para esses filtros.</strong>
          Tente uma matéria mais genérica ou limpe os campos.
        </div>
      )}

      {!erro && !carregando && mentores.length > 0 && (
        <div className="lista">
          {mentores.map((mentor) => (
            <Link className="cartao" to={`/mentores/${mentor.id}`} key={mentor.id}>
              <div>
                <span className="rotulo">{mentor.curso} &middot; {mentor.periodo}º período</span>
                <h3>{mentor.nome}</h3>
                <p>{mentor.bio}</p>
                <div className="materias">
                  {mentor.areas.map((area) => (
                    <span className="materia" key={area.id}>{area.materia}</span>
                  ))}
                </div>
              </div>
              <Reputacao reputacao={mentor.reputacao} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
