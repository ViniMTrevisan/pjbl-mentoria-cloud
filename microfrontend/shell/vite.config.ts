import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

const padraoDescoberta = 'http://localhost:3001/assets/remoteEntry.js';
const padraoAgenda = 'http://localhost:3002/assets/remoteEntry.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const descoberta = env.VITE_MFE_DESCOBERTA_URL || padraoDescoberta;
  const agenda = env.VITE_MFE_AGENDA_URL || padraoAgenda;

  return {
    plugins: [
      react(),
      federation({
        name: 'shell',
        remotes: {
          mfe_descoberta: {
            external: descoberta,
            format: 'esm',
            from: 'vite',
          },
          mfe_agenda: {
            external: agenda,
            format: 'esm',
            from: 'vite',
          },
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.3.1' },
          'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
        },
      }),
    ],
    build: {
      target: 'esnext',
      cssCodeSplit: false,
    },
    server: {
      port: 3000,
      strictPort: true,
      cors: true,
    },
    preview: {
      port: 3000,
      strictPort: true,
      cors: true,
    },
  };
});
