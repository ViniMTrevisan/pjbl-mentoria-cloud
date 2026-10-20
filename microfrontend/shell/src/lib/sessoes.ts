import type { Sessao } from '../types';

const ABERTAS = new Set(['SOLICITADA', 'ACEITA']);

export interface SessoesSeparadas {
  proximas: Sessao[];
  historico: Sessao[];
}

/**
 * Mesma regra do BFF: próximas são futuras e abertas (asc), histórico é o resto (desc).
 * Reimplementada aqui para o dashboard não depender da ordenação do servidor.
 */
export function separarSessoes(sessoes: Sessao[], agora: Date = new Date()): SessoesSeparadas {
  const limite = agora.getTime();
  const proximas: Sessao[] = [];
  const historico: Sessao[] = [];

  for (const sessao of sessoes) {
    const quando = Date.parse(sessao.dataHora);
    if (Number.isFinite(quando) && quando >= limite && ABERTAS.has(sessao.status)) {
      proximas.push(sessao);
    } else {
      historico.push(sessao);
    }
  }

  const porData = (a: Sessao, b: Sessao): number => {
    const delta = Date.parse(a.dataHora) - Date.parse(b.dataHora);
    return Number.isNaN(delta) || delta === 0 ? a.id.localeCompare(b.id) : delta;
  };

  proximas.sort(porData);
  historico.sort((a, b) => porData(b, a));

  return { proximas, historico };
}
