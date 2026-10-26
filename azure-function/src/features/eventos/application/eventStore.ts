import type { Reputacao } from "../../reputacao/domain/reputacao";

export interface Evento {
  id: string;
  type: string;
  source: string;
  time: string;
  data: Record<string, unknown>;
}

const LIMITE = 100;

/**
 * Buffer de eventos em memória. No alvo Azure este papel é do Service Bus
 * (tópico veterano.eventos). Aqui ele existe para a demo local do fluxo EDA,
 * com idempotência por `id`, como um consumidor real faria.
 */
class EventStore {
  private readonly eventos: Evento[] = [];
  private readonly ids = new Set<string>();

  registrar(evento: Evento): boolean {
    if (this.ids.has(evento.id)) return false;
    this.ids.add(evento.id);
    this.eventos.push(evento);
    if (this.eventos.length > LIMITE) {
      const removido = this.eventos.shift();
      if (removido) this.ids.delete(removido.id);
    }
    return true;
  }

  listar(limite: number): { total: number; itens: Evento[] } {
    const itens = this.eventos.slice(-limite).reverse();
    return { total: this.eventos.length, itens };
  }
}

export const eventStore = new EventStore();

export function eventoValido(valor: unknown): valor is Evento {
  if (typeof valor !== "object" || valor === null) return false;
  const candidato = valor as Partial<Evento>;
  return (
    typeof candidato.id === "string" &&
    candidato.id.length > 0 &&
    typeof candidato.type === "string" &&
    candidato.type.length > 0 &&
    typeof candidato.source === "string" &&
    typeof candidato.time === "string" &&
    typeof candidato.data === "object" &&
    candidato.data !== null
  );
}

export function resumoReputacao(reputacao: Reputacao): string {
  if (reputacao.semAvaliacoes) return "Sem avaliações ainda";
  return `${reputacao.media?.toFixed(1)} (${reputacao.total})`;
}
