const FORMATADOR = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return 'data inválida';
  const partes = Object.fromEntries(
    FORMATADOR.formatToParts(data).map((parte) => [parte.type, parte.value]),
  );
  return `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}`;
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function diaDaSemana(dia: number): string {
  return DIAS[dia] ?? `Dia ${dia}`;
}

export function mediaFormatada(media: number | null | undefined): string {
  if (typeof media !== 'number') return '—';
  return media.toFixed(1).replace('.', ',');
}
