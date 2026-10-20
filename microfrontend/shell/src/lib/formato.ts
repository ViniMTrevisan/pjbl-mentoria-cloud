const FORMATADOR = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const FORMATADOR_BLOCO = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'short',
  weekday: 'short',
});

/** `2026-10-22T17:00:00.000Z` → `22/10/2026 14:00` (horário de São Paulo). */
export function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return 'data inválida';

  const partes = Object.fromEntries(
    FORMATADOR.formatToParts(data).map((parte) => [parte.type, parte.value]),
  );

  return `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}`;
}

/** Bloco compacto para listas: dia, mês abreviado e dia da semana. */
export function blocoDeData(iso: string): { dia: string; mes: string; semana: string } {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return { dia: '--', mes: '---', semana: '' };

  const partes = Object.fromEntries(
    FORMATADOR_BLOCO.formatToParts(data).map((parte) => [parte.type, parte.value]),
  );

  return {
    dia: partes.day ?? '--',
    mes: (partes.month ?? '---').replace('.', ''),
    semana: (partes.weekday ?? '').replace('.', ''),
  };
}

const ROTULOS_STATUS: Record<string, string> = {
  SOLICITADA: 'Aguardando resposta',
  ACEITA: 'Confirmada',
  RECUSADA: 'Recusada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export function statusLabel(status: string): string {
  return ROTULOS_STATUS[status] ?? status;
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function diaDaSemana(dia: number): string {
  return DIAS[dia] ?? `Dia ${dia}`;
}

export function minutosDesdeMeiaNoite(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
