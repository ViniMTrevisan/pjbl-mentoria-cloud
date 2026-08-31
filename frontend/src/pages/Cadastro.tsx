import { useCallback, useEffect, useState } from 'react';
import { alterarMentor, excluirMentor, inserirMentor, pesquisarMentores } from '../api';
import type { EntradaMentor, MentorDb } from '../types';

/**
 * Tela 4 — Cadastro de mentores (MongoDB Atlas).
 * Executa as 4 Azure Functions de CRUD:
 *   mentoresInserir · mentoresPesquisar · mentoresAlterar · mentoresExcluir
 * O registro de chamadas na lateral mostra qual Function respondeu cada acao.
 */

const VAZIO: EntradaMentor = { nome: '', curso: '', periodo: null, bio: '', areas: [] };

type Registro = { funcao: string; verbo: string; rota: string; ok: boolean; texto: string; hora: string };

export function Cadastro() {
  const [form, setForm] = useState<EntradaMentor>(VAZIO);
  const [materias, setMaterias] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [mentores, setMentores] = useState<MentorDb[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [registros, setRegistros] = useState<Registro[]>([]);

  const registrar = (r: Omit<Registro, 'hora'>) =>
    setRegistros((atual) => [{ ...r, hora: new Date().toLocaleTimeString('pt-BR') }, ...atual].slice(0, 8));

  // AZURE FUNCTION mentoresPesquisar — GET /api/mentores-db?q=
  const pesquisar = useCallback(async (termo: string) => {
    setCarregando(true);
    setErroLista(null);
    try {
      const dados = await pesquisarMentores(termo);
      setMentores(dados.mentores);
      registrar({
        funcao: 'mentoresPesquisar', verbo: 'GET',
        rota: `/api/mentores-db${termo ? `?q=${termo}` : ''}`,
        ok: true, texto: `200 · ${dados.total} registro(s)`,
      });
    } catch (e) {
      const msg = (e as Error).message;
      setErroLista(msg);
      registrar({ funcao: 'mentoresPesquisar', verbo: 'GET', rota: '/api/mentores-db', ok: false, texto: msg });
    } finally {
      setCarregando(false);
    }
  }, []);

  // Debounce: nao dispara uma Function por tecla digitada.
  useEffect(() => {
    const t = setTimeout(() => void pesquisar(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca, pesquisar]);

  const limpar = () => {
    setForm(VAZIO);
    setMaterias('');
    setEditandoId(null);
  };

  // AZURE FUNCTIONS mentoresInserir (POST) e mentoresAlterar (PUT)
  const salvar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setSalvando(true);
    const dados: EntradaMentor = {
      ...form,
      nome: form.nome.trim(),
      curso: form.curso.trim(),
      areas: materias
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
        .map((materia, i) => ({ id: `a${i + 1}`, curso: form.curso.trim(), materia })),
    };
    try {
      if (editandoId) {
        const r = await alterarMentor(editandoId, dados);
        registrar({ funcao: 'mentoresAlterar', verbo: 'PUT', rota: `/api/mentores-db/${editandoId}`, ok: true, texto: `200 · ${r.mentor.nome}` });
      } else {
        const r = await inserirMentor(dados);
        registrar({ funcao: 'mentoresInserir', verbo: 'POST', rota: '/api/mentores-db', ok: true, texto: `201 · id ${r.mentor.id}` });
      }
      limpar();
      await pesquisar(busca.trim());
    } catch (e) {
      const msg = (e as Error).message;
      registrar({
        funcao: editandoId ? 'mentoresAlterar' : 'mentoresInserir',
        verbo: editandoId ? 'PUT' : 'POST',
        rota: '/api/mentores-db', ok: false, texto: msg,
      });
    } finally {
      setSalvando(false);
    }
  };

  // AZURE FUNCTION mentoresExcluir — DELETE /api/mentores-db/{id}
  const excluir = async (mentor: MentorDb) => {
    if (!confirm(`Excluir ${mentor.nome} do banco?`)) return;
    try {
      await excluirMentor(mentor.id);
      registrar({ funcao: 'mentoresExcluir', verbo: 'DELETE', rota: `/api/mentores-db/${mentor.id}`, ok: true, texto: `200 · ${mentor.nome}` });
      if (editandoId === mentor.id) limpar();
      await pesquisar(busca.trim());
    } catch (e) {
      const msg = (e as Error).message;
      registrar({ funcao: 'mentoresExcluir', verbo: 'DELETE', rota: `/api/mentores-db/${mentor.id}`, ok: false, texto: msg });
    }
  };

  const editar = (m: MentorDb) => {
    setEditandoId(m.id);
    setForm({ nome: m.nome, curso: m.curso, periodo: m.periodo, bio: m.bio, areas: m.areas });
    setMaterias(m.areas.map((a) => a.materia).join(', '));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <h1 className="titulo-secao">Cadastro de mentores.</h1>
      <p className="linha-fina">
        Esta tela grava no <strong>MongoDB Atlas</strong> através de quatro Azure Functions — uma para
        cada operação. O registro ao lado mostra qual Function respondeu cada ação.
      </p>

      <div className="crud">
        <form className="painel" onSubmit={salvar}>
          <h2>{editandoId ? 'Alterar mentor' : 'Inserir mentor'}</h2>
          {editandoId && <p className="crud-id">editando id {editandoId}</p>}

          <div className="crud-campos">
            <label className="campo">
              <span className="rotulo">Nome *</span>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ana Beatriz Moraes" />
            </label>
            <label className="campo">
              <span className="rotulo">Curso *</span>
              <input required value={form.curso} onChange={(e) => setForm({ ...form, curso: e.target.value })} placeholder="Engenharia de Software" />
            </label>
            <label className="campo">
              <span className="rotulo">Período</span>
              <input
                type="number" min={1} max={12}
                value={form.periodo ?? ''}
                onChange={(e) => setForm({ ...form, periodo: e.target.value ? Number(e.target.value) : null })}
                placeholder="7"
              />
            </label>
            <label className="campo">
              <span className="rotulo">Matérias (separadas por vírgula)</span>
              <input value={materias} onChange={(e) => setMaterias(e.target.value)} placeholder="Banco de Dados, Cloud" />
            </label>
            <label className="campo campo-largo">
              <span className="rotulo">Bio</span>
              <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Fui monitor de Estrutura de Dados por 3 semestres." />
            </label>
          </div>

          <div className="crud-acoes">
            <button className="botao botao-marca" type="submit" disabled={salvando}>
              {salvando ? 'gravando...' : editandoId ? 'salvar alteração (PUT)' : 'inserir (POST)'}
            </button>
            {editandoId && (
              <button className="botao" type="button" onClick={limpar}>cancelar</button>
            )}
          </div>
        </form>

        <aside className="painel">
          <h2>Chamadas às Functions</h2>
          {registros.length === 0 ? (
            <p className="linha-fina" style={{ margin: 0 }}>Nenhuma chamada ainda.</p>
          ) : (
            <ul className="log">
              {registros.map((r, i) => (
                <li key={i} className={r.ok ? '' : 'log-erro'}>
                  <strong>{r.funcao}</strong>
                  <span>{r.verbo} {r.rota}</span>
                  <span>{r.hora} — {r.texto}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <div className="busca" style={{ gridTemplateColumns: '1fr' }}>
        <label className="campo">
          <span className="rotulo">Pesquisar (GET /api/mentores-db?q=) — nome, curso, bio ou matéria</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="cloud, banco de dados, Ana..." />
        </label>
      </div>

      {erroLista && (
        <div className="estado erro">
          <strong>Não foi possível consultar o banco.</strong>
          {erroLista}
        </div>
      )}

      {!erroLista && carregando && <div className="estado">Consultando MongoDB...</div>}

      {!erroLista && !carregando && mentores.length === 0 && (
        <div className="estado">
          <strong>Nenhum registro encontrado.</strong>
          {busca ? 'Tente outro termo ou limpe a busca.' : 'Cadastre o primeiro mentor no formulário acima.'}
        </div>
      )}

      {!erroLista && !carregando && mentores.length > 0 && (
        <div className="lista">
          {mentores.map((m) => (
            <article className="cartao" key={m.id}>
              <div>
                <span className="rotulo">{m.curso}{m.periodo ? ` · ${m.periodo}º período` : ''}</span>
                <h3>{m.nome}</h3>
                <p>{m.bio || 'Sem bio cadastrada.'}</p>
                <div className="materias">
                  {m.areas.map((a, i) => <span className="materia" key={i}>{a.materia}</span>)}
                </div>
                <span className="crud-id">id {m.id}</span>
              </div>
              <div className="crud-acoes crud-acoes-linha">
                <button className="botao" type="button" onClick={() => editar(m)}>alterar</button>
                <button className="botao botao-perigo" type="button" onClick={() => void excluir(m)}>excluir</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
