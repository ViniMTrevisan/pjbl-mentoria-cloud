import { Suspense, lazy } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EsqueletoPagina } from './components/Esqueleto';
import { SeletorUsuario } from './components/SeletorUsuario';
import { Dashboard } from './pages/Dashboard';
import { NaoEncontrada } from './pages/NaoEncontrada';
import { useUsuario } from './lib/usuario';

// Remotes carregados em runtime; se um deles estiver fora, o ErrorBoundary assume.
const Descoberta = lazy(() => import('mfe_descoberta/App'));
const Agenda = lazy(() => import('mfe_agenda/App'));

const SECOES: Record<string, string> = {
  '/': 'Dashboard',
  '/mentores': 'Mentores',
  '/sessoes': 'Sessões',
};

const NAVEGACAO = [
  { para: '/', rotulo: 'Dashboard', indice: '01' },
  { para: '/mentores', rotulo: 'Mentores', indice: '02' },
  { para: '/sessoes', rotulo: 'Sessões', indice: '03' },
];

function Layout() {
  const { id, usuario, definirUsuario } = useUsuario();
  const local = useLocation();
  const secao = SECOES[local.pathname] ?? 'Portal';

  return (
    <div className="app">
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>

      <aside className="sidebar">
        <div className="marca">
          <span className="marca-simbolo" aria-hidden="true">
            V
          </span>
          <div>
            <strong>Veterano</strong>
            <small>mentoria PUC PR</small>
          </div>
        </div>

        <nav className="nav" aria-label="Principal">
          {NAVEGACAO.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              end={item.para === '/'}
              className={({ isActive }) => (isActive ? 'nav-item ativo' : 'nav-item')}
            >
              <span className="nav-indice" aria-hidden="true">
                {item.indice}
              </span>
              {item.rotulo}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-rodape">
          <SeletorUsuario id={id} aoTrocar={definirUsuario} />
          <p className="sidebar-nota">Entrega 3 · microfrontends + BFF</p>
        </div>
      </aside>

      <div className="conteudo">
        <header className="topbar">
          <div className="topbar-trilha">
            <span>Veterano</span>
            <span aria-hidden="true">/</span>
            <strong>{secao}</strong>
          </div>

          <div className="topbar-usuario">
            <span className="avatar" aria-hidden="true">
              {usuario.nome.charAt(0)}
            </span>
            <span className="topbar-nome">
              {usuario.nome}
              <small>{usuario.papel === 'mentor' ? 'mentor' : 'calouro'}</small>
            </span>
            <SeletorUsuario id={id} aoTrocar={definirUsuario} compacto />
          </div>
        </header>

        <main id="conteudo" className="conteudo-principal">
          <Routes>
            <Route path="/" element={<Dashboard usuario={usuario} />} />
            <Route
              path="/mentores"
              element={
                <Suspense fallback={<EsqueletoPagina />}>
                  <ErrorBoundary modulo="a descoberta de mentores">
                    <Descoberta />
                  </ErrorBoundary>
                </Suspense>
              }
            />
            <Route
              path="/sessoes"
              element={
                <Suspense fallback={<EsqueletoPagina />}>
                  <ErrorBoundary modulo="a agenda de sessões">
                    <Agenda />
                  </ErrorBoundary>
                </Suspense>
              }
            />
            <Route path="*" element={<NaoEncontrada />} />
          </Routes>
        </main>

        <footer className="rodape">
          <span>Bento Barp · Guilherme Reis · Guilherme Selenko · Vinicius Trevisan</span>
          <span className="rodape-mono">arq-cloud / entrega 3</span>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
