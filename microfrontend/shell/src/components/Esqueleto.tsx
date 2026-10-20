/** Esqueleto de carregamento com a mesma silhueta do conteúdo real. */
export function Esqueleto({ linhas = 3, altura = '1rem' }: { linhas?: number; altura?: string }) {
  return (
    <div className="esqueleto" aria-hidden="true">
      {Array.from({ length: linhas }, (_, indice) => (
        <span key={indice} style={{ height: altura, width: `${100 - indice * 12}%` }} />
      ))}
    </div>
  );
}

export function EsqueletoPagina() {
  return (
    <div className="pagina-carregando" aria-busy="true" aria-label="Carregando conteúdo">
      <Esqueleto linhas={2} altura="1.5rem" />
      <div className="kpis">
        {Array.from({ length: 4 }, (_, indice) => (
          <div className="cartao" key={indice}>
            <Esqueleto linhas={3} />
          </div>
        ))}
      </div>
      <div className="cartao">
        <Esqueleto linhas={4} altura="2.25rem" />
      </div>
    </div>
  );
}
