import type { FiltroSessoes, Sessao } from '../domain/sessao';
import type { EventoPendente } from '../domain/sessao';

/** Contrato de persistencia de sessoes. */
export interface SessaoRepository {
  listar(filtro: FiltroSessoes): Promise<Sessao[]>;
  buscarPorId(id: string): Promise<Sessao | null>;
  /** Cria a sessao e enfileira o evento na mesma unidade de trabalho. */
  criar(sessao: Sessao, evento: EventoPendente): Promise<Sessao>;
  /**
   * Atualiza com concorrencia otimista: so altera se o status atual for o esperado.
   * Retorna null quando outra transicao venceu a corrida.
   */
  atualizarStatus(
    id: string,
    statusEsperado: string,
    novoStatus: string,
    evento: EventoPendente,
    agora: string,
  ): Promise<Sessao | null>;
  inserirVarios(sessoes: Sessao[]): Promise<void>;
  contar(): Promise<number>;
  verificarSaude(): Promise<boolean>;
}
