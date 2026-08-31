import { NavLink, Route, Routes } from 'react-router-dom';
import { Mentores } from './pages/Mentores';
import { MentorDetalhe } from './pages/MentorDetalhe';
import { Sessoes } from './pages/Sessoes';
import { Cadastro } from './pages/Cadastro';
import { API_BASE } from './api';

export default function App() {
  return (
    <div className="casca">
      <header className="topo">
        <div>
          <h1 className="marca-titulo">Veterano<span>.</span></h1>
          <p className="marca-sub">Mentoria entre alunos &middot; PUCPR</p>
        </div>
        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'ativo' : '')} end>
            buscar mentores
          </NavLink>
          <NavLink to="/sessoes" className={({ isActive }) => (isActive ? 'ativo' : '')}>
            minhas sessões
          </NavLink>
          <NavLink to="/cadastro" className={({ isActive }) => (isActive ? 'ativo' : '')}>
            cadastro
          </NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Mentores />} />
          <Route path="/mentores/:id" element={<MentorDetalhe />} />
          <Route path="/sessoes" element={<Sessoes />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="*" element={<div className="estado"><strong>Página não encontrada.</strong>Volte para a busca de mentores.</div>} />
        </Routes>
      </main>

      <footer className="rodape">
        PJBL &middot; Arquitetura e Soluções em Cloud &middot; Bento Barp, Guilherme Reis, Guilherme Selenko, Vinicius Trevisan
        <br />
        API (Azure Functions): {API_BASE}
      </footer>
    </div>
  );
}
