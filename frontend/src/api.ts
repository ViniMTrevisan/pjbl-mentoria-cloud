import type {
  EntradaMentor,
  MentorDetalhado,
  RespostaEscrita,
  RespostaMentores,
  RespostaPesquisa,
  RespostaSessoes,
} from './types';

// URL da Azure Function App. Em producao vem de VITE_API_BASE_URL (definida no
// build do Static Web App); em dev cai no localhost do Functions Core Tools.
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7071';

async function buscar<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${BASE}/api${caminho}`);
  if (!resposta.ok) {
    throw new Error(`A API respondeu ${resposta.status}. Tente novamente em instantes.`);
  }
  return resposta.json() as Promise<T>;
}

export function listarMentores(filtros: { curso?: string; materia?: string; q?: string }) {
  const params = new URLSearchParams();
  if (filtros.curso) params.set('curso', filtros.curso);
  if (filtros.materia) params.set('materia', filtros.materia);
  if (filtros.q) params.set('q', filtros.q);
  const query = params.toString();
  return buscar<RespostaMentores>(`/mentores${query ? `?${query}` : ''}`);
}

export const obterMentor = (id: string) => buscar<MentorDetalhado>(`/mentores/${id}`);
export const listarSessoes = () => buscar<RespostaSessoes>('/sessoes');
export const API_BASE = BASE;

/* ------------------------------------------------------------------
   CRUD no MongoDB Atlas — uma Azure Function por operacao.

   inserir   -> POST   /api/mentores-db        (Function mentoresInserir)
   pesquisar -> GET    /api/mentores-db?q=     (Function mentoresPesquisar)
   alterar   -> PUT    /api/mentores-db/{id}   (Function mentoresAlterar)
   excluir   -> DELETE /api/mentores-db/{id}   (Function mentoresExcluir)
   ------------------------------------------------------------------ */

async function chamar<T>(caminho: string, metodo: string, corpo?: unknown): Promise<T> {
  const resposta = await fetch(`${BASE}/api${caminho}`, {
    method: metodo,
    headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    // A Function devolve { erro, detalhes[] }; mostramos a mensagem dela, nao um codigo cru.
    const detalhes = (dados as { detalhes?: string[] } | null)?.detalhes;
    const erro = (dados as { erro?: string } | null)?.erro ?? `HTTP ${resposta.status}`;
    throw new Error(detalhes?.length ? `${erro}: ${detalhes.join(', ')}` : erro);
  }
  return dados as T;
}

export const inserirMentor = (dados: EntradaMentor) =>
  chamar<RespostaEscrita>('/mentores-db', 'POST', dados);

export const pesquisarMentores = (q: string) =>
  chamar<RespostaPesquisa>(`/mentores-db${q ? `?q=${encodeURIComponent(q)}` : ''}`, 'GET');

export const alterarMentor = (id: string, dados: Partial<EntradaMentor>) =>
  chamar<RespostaEscrita>(`/mentores-db/${id}`, 'PUT', dados);

export const excluirMentor = (id: string) =>
  chamar<RespostaEscrita>(`/mentores-db/${id}`, 'DELETE');
