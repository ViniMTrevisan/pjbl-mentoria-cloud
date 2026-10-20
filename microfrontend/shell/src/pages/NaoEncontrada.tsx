import { Link } from 'react-router-dom';

export function NaoEncontrada() {
  return (
    <div className="pagina">
      <section className="cartao estado-erro">
        <p className="sobrescrito">Erro 404</p>
        <h1>Essa página não existe.</h1>
        <p className="texto-apoio">
          O endereço pode ter mudado. Volte ao dashboard ou siga direto para a busca de mentores.
        </p>
        <div className="acoes">
          <Link className="botao botao-primario" to="/">
            Ir para o dashboard
          </Link>
          <Link className="botao botao-secundario" to="/mentores">
            Ver mentores
          </Link>
        </div>
      </section>
    </div>
  );
}
