import type { MentorDetalhado, RespostaMentores, RespostaSessoes } from './types';

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
