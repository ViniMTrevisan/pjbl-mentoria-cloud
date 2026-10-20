import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Nome exibido no fallback, ex.: "Descoberta de mentores". */
  modulo: string;
}

interface State {
  falhou: boolean;
}

/**
 * Isola a falha de um remote: se o módulo não carregar, o shell continua navegável.
 * O botão recarrega a página porque o import dinâmico fica em cache após rejeitar.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { falhou: false };

  static getDerivedStateFromError(): State {
    return { falhou: true };
  }

  override componentDidCatch(erro: Error, info: ErrorInfo): void {
    console.error(`[shell] falha ao carregar ${this.props.modulo}`, erro, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.falhou) return this.props.children;

    return (
      <section className="cartao modulo-fora" role="alert" aria-live="polite">
        <p className="sobrescrito">Módulo indisponível</p>
        <h2>Não foi possível carregar {this.props.modulo}</h2>
        <p className="texto-apoio">
          O microfrontend não respondeu. O restante do portal continua funcionando — dashboard,
          navegação e seu usuário seguem ativos.
        </p>
        <button type="button" className="botao botao-primario" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </section>
    );
  }
}
