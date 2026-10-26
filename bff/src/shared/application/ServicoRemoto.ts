import type { MetodoHttp, ParametrosQuery, RespostaBruta } from './contratos';

export interface EntradaRemota {
  caminho: string;
  query?: ParametrosQuery;
  corpo?: unknown;
  usuarioId?: string;
}

/**
 * Porta de saída genérica para um serviço interno.
 * A apresentação (proxy) depende desta abstração; a infraestrutura HTTP a implementa.
 */
export interface ServicoRemoto {
  readonly servico: string;
  encaminhar(metodo: MetodoHttp, entrada: EntradaRemota): Promise<RespostaBruta>;
  /** Ping curto usado pelo /health; qualquer falha vira `false`. */
  disponivel(caminho: string, timeoutMs: number): Promise<boolean>;
}
