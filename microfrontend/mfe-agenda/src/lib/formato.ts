import type { Sessao } from '../types';

const FORMATADOR = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const BLOCO = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'short',
  weekday: 'short',
});

export function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return 'data inválida';
  const partes = Object.fromEntries(
    FORMATADOR.formatToParts(data).map((parte) => [parte.type, parte.value]),
  );
  return `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}`;
}

export function blocoDeData(iso: string): { dia: string; mes: string; semana: string } {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return { dia: '--', mes: '---', semana: '' };
  const partes = Object.fromEntries(
    BLOCO.formatToParts(data).map((parte) => [parte.type, parte.value]),
  );
  return {
    dia: partes.day ?? '--',
    mes: (partes.month ?? '---').replace('.', ''),
    semana: (partes.weekday ?? '').replace('.', ''),
  };
}

const ROTULOS: Record<string, string> = {
  SOLICITADA: 'Aguardando resposta',
  ACEITA: 'Confirmada',
  RECUSADA: 'Recusada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export function statusLabel(status: string): string {
  return ROTULOS[status] ?? status;
}

const ABERTAS = new Set(['SOLICITADA', 'ACEITA']);

export function separarSessoes(
  sessoes: Sessao[],
  agora: Date = new Date(),
): { proximas: Sessao[]; historico: Sessao[] } {
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
