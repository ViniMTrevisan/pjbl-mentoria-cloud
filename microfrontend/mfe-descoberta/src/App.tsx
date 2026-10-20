import { useCallback, useEffect, useMemo, useState } from 'react';
import { buscarAgregado, ErroApi } from './api';
import { DetalheMentor } from './components/DetalheMentor';
import { MentorCard } from './components/MentorCard';
import { useUsuario } from './lib/usuario';
import type { Mentor } from './types';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; mentores: Mentor[]; parcial: boolean }
  | { tipo: 'erro'; mensagem: string };

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export default function App() {
  const { id, usuario } = useUsuario();
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [texto, setTexto] = useState('');
  const [curso, setCurso] = useState('');
  const [materia, setMateria] = useState('');
  const [selecionado, setSelecionado] = useState<Mentor | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    setEstado({ tipo: 'carregando' });

    buscarAgregado(id)
      .then((dados) => {
        if (!ativo) return;
        const ordenados = [...dados.mentores].sort((a, b) => {
          const diferenca = (b.reputacao?.media ?? -1) - (a.reputacao?.media ?? -1);
          return diferenca !== 0 ? diferenca : a.nome.localeCompare(b.nome);
        });
        setEstado({ tipo: 'pronto', mentores: ordenados, parcial: dados.parcial });
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        setEstado({
          tipo: 'erro',
          mensagem:
            erro instanceof ErroApi ? erro.message : 'Não foi possível carregar os mentores.',
        });
      });

    return () => {
      ativo = false;
    };
  }, [id, versao]);

  useEffect(() => {
    const aoAtualizar = () => setVersao((atual) => atual + 1);
    window.addEventListener('veterano:sessoes-atualizadas', aoAtualizar);
    return () => window.removeEventListener('veterano:sessoes-atualizadas', aoAtualizar);
  }, []);

  const mentores = estado.tipo === 'pronto' ? estado.mentores : [];

  const cursos = useMemo(() => {
    const conjunto = new Set(mentores.map((mentor) => mentor.curso).filter(Boolean));
    return [...conjunto].sort((a, b) => a.localeCompare(b));
  }, [mentores]);

  const materias = useMemo(() => {
    const conjunto = new Set(
      mentores.flatMap((mentor) => mentor.areas.map((area) => area.materia)).filter(Boolean),
    );
    return [...conjunto].sort((a, b) => a.localeCompare(b));
  }, [mentores]);

  const filtrados = useMemo(() => {
    const alvo = normalizar(texto);
    return mentores.filter((mentor) => {
      if (curso && mentor.curso !== curso) return false;
      if (materia && !mentor.areas.some((area) => area.materia === materia)) return false;
      if (!alvo) return true;

      const palheiro = normalizar(
        [
          mentor.nome,
          mentor.bio,
          mentor.curso,
          ...mentor.areas.map((area) => `${area.materia} ${area.curso}`),
        ].join(' '),
      );
      return palheiro.includes(alvo);
    });
  }, [mentores, texto, curso, materia]);

  const fechar = useCallback(() => setSelecionado(null), []);

  const aoSolicitar = useCallback(
    (mensagem: string) => {
      setFeedback(mensagem);
      setSelecionado(null);
    },
    [],
  );

  return (
    <div className="mfe">
      <header className="mfe-cabecalho">
        <div>
          <p className="sobrescrito">Descoberta</p>
          <h1>Quem já passou por isso</h1>
          <p className="texto-apoio">
            Filtre por matéria, curso ou nome. A reputação vem das sessões concluídas.
          </p>
        </div>
        <span className="contagem" aria-live="polite">
          {estado.tipo === 'pronto'
            ? `${filtrados.length} de ${mentores.length} mentor${mentores.length === 1 ? '' : 'es'}`
            : 'carregando'}
        </span>
      </header>

      {feedback ? (
        <div className="feedback" role="status">
          <p>{feedback}</p>
          <button type="button" className="fechar-feedback" onClick={() => setFeedback(null)}>
            Fechar
          </button>
        </div>
      ) : null}

      {estado.tipo === 'pronto' && estado.parcial ? (
        <p className="aviso-parcial" role="status">
          Alguns dados não responderam a tempo. A lista pode estar incompleta.
        </p>
      ) : null}

      <div className="filtros">
        <label className="campo-busca">
          <span className="rotulo-mini">Buscar</span>
          <input
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Nome, matéria ou curso"
            aria-label="Buscar mentores por nome, matéria ou curso"
          />
        </label>

        <label className="campo-select">
          <span className="rotulo-mini">Curso</span>
          <select value={curso} onChange={(evento) => setCurso(evento.target.value)}>
            <option value="">Todos os cursos</option>
            {cursos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {materias.length > 0 ? (
        <div className="chips" role="group" aria-label="Filtrar por matéria">
          <button
            type="button"
            className={materia === '' ? 'chip ativo' : 'chip'}
            aria-pressed={materia === ''}
            onClick={() => setMateria('')}
          >
            Todas
          </button>
          {materias.map((item) => (
            <button
              key={item}
              type="button"
              className={materia === item ? 'chip ativo' : 'chip'}
              aria-pressed={materia === item}
              onClick={() => setMateria(materia === item ? '' : item)}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {estado.tipo === 'carregando' ? (
        <div className="grade-mentores" aria-busy="true" aria-label="Carregando mentores">
          {Array.from({ length: 3 }, (_, indice) => (
            <div key={indice} className="mentor-card esqueleto-card" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : null}

      {estado.tipo === 'erro' ? (
        <section className="cartao estado-erro" role="alert">
          <p className="sobrescrito">Falha de conexão</p>
          <h2>A lista de mentores não carregou</h2>
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

      {estado.tipo === 'pronto' && mentores.length === 0 ? (
        <div className="vazio">
          <p>Nenhum mentor cadastrado ainda.</p>
          <p className="texto-apoio">
            Assim que os veteranos publicarem áreas de mentoria, eles aparecem aqui.
          </p>
        </div>
      ) : null}

      {estado.tipo === 'pronto' && mentores.length > 0 && filtrados.length === 0 ? (
        <div className="vazio">
          <p>Nenhum mentor com esses filtros.</p>
          <p className="texto-apoio">Tente outra matéria ou limpe a busca.</p>
          <button
            type="button"
            className="botao botao-secundario"
            onClick={() => {
              setTexto('');
              setCurso('');
              setMateria('');
            }}
          >
            Limpar filtros
          </button>
        </div>
      ) : null}

      {estado.tipo === 'pronto' && filtrados.length > 0 ? (
        <div className="grade-mentores">
          {filtrados.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} aoAbrir={setSelecionado} />
          ))}
        </div>
      ) : null}

      {selecionado ? (
        <DetalheMentor
          mentor={selecionado}
          usuario={usuario}
          aoFechar={fechar}
          aoSolicitar={aoSolicitar}
        />
      ) : null}
    </div>
  );
}
