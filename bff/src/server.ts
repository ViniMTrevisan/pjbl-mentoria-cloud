import { carregarConfig } from './infrastructure/config';
import { criarApp } from './http/app';

const config = carregarConfig();
const app = criarApp(config);

const servidor = app.listen(config.PORT, () => {
  console.log(`[bff] ouvindo em http://localhost:${config.PORT}`);
  console.log(
    `[bff] mentores=${config.MENTORES_URL} sessoes=${config.SESSOES_URL} function=${config.FUNCTION_URL}`,
  );
});

function encerrar(sinal: string): void {
  console.log(`[bff] recebido ${sinal}, encerrando`);
  servidor.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));
