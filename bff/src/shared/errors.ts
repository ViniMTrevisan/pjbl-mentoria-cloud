/** Falha ao conversar com uma dependência externa (rede, timeout ou formato inesperado). */
export class ErroDependencia extends Error {
  readonly servico: string;
  readonly motivo: 'rede' | 'timeout' | 'formato';

  constructor(servico: string, motivo: 'rede' | 'timeout' | 'formato', mensagem?: string) {
    super(mensagem ?? `Falha em ${servico} (${motivo})`);
    this.name = 'ErroDependencia';
    this.servico = servico;
    this.motivo = motivo;
  }
}

export function ehErroDependencia(erro: unknown): erro is ErroDependencia {
  return erro instanceof ErroDependencia;
}
