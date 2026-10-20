import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

document.body.classList.add('mfe-standalone');

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Elemento #root não encontrado');

createRoot(raiz).render(
  <StrictMode>
    <div className="mfe-standalone-casca">
      <App />
    </div>
  </StrictMode>,
);
