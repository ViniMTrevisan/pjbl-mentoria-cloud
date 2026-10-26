import { Router } from 'express';
import type { Saude } from '../../agregacao/domain/agregado';
import type { ServicoRemoto } from '../../../shared/application/ServicoRemoto';

export interface DependenciasSaude {
  mentores: ServicoRemoto;
  sessoes: ServicoRemoto;
  funcao: ServicoRemoto;
}

/** Slice `saude`: reúne o estado das três dependências do BFF. */
export function saudeRoutes(deps: DependenciasSaude, timeoutMs: number): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const [mentores, sessoes, funcao] = await Promise.all([
      deps.mentores.disponivel('/health', timeoutMs),
      deps.sessoes.disponivel('/health', timeoutMs),
      deps.funcao.disponivel('/api/health', timeoutMs),
    ]);

    const saude: Saude = {
      status: mentores && sessoes && funcao ? 'ok' : 'degradado',
      dependencias: {
        mentores: mentores ? 'ok' : 'fora',
        sessoes: sessoes ? 'ok' : 'fora',
        function: funcao ? 'ok' : 'fora',
      },
    };

    res.status(200).json(saude);
  });

  return router;
}
