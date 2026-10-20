import { Router } from 'express';
import { z } from 'zod';
import { dadosInvalidos } from '../../domain/errors';
import { normalizarFiltroStatus } from '../../domain/validation';
import { changeStatus } from '../../features/changeStatus';
import { createSessao } from '../../features/createSessao';
import { getSessao } from '../../features/getSessao';
import { listSessoes } from '../../features/listSessoes';
import type { SessaoRepository } from '../../ports/SessaoRepository';
import { asyncHandler } from '../errorHandler';

const acaoSchema = z.enum(['aceitar', 'recusar', 'concluir', 'cancelar']);

const statusBodySchema = z.object({
  acao: acaoSchema,
  atorId: z.string().min(1),
});

const querySchema = z.object({
  usuarioId: z.string().optional(),
  status: z.string().optional(),
});

export function sessoesRoutes(repo: SessaoRepository): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = querySchema.safeParse(req.query);
      if (!query.success) {
        throw dadosInvalidos({ query: 'usuarioId e status devem ser textos' });
      }

      const campos: Record<string, string> = {};
      const status = normalizarFiltroStatus(query.data.status, campos);
      if (Object.keys(campos).length > 0) throw dadosInvalidos(campos);

      const resultado = await listSessoes(repo, {
        usuarioId: query.data.usuarioId,
        status,
      });
      res.status(200).json(resultado);
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const sessao = await getSessao(repo, req.params.id as string);
      res.status(200).json(sessao);
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const sessao = await createSessao(repo, req.body);
      res.status(201).json(sessao);
    }),
  );

  router.patch(
    '/:id/status',
    asyncHandler(async (req, res) => {
      const body = statusBodySchema.safeParse(req.body);
      if (!body.success) {
        const campos: Record<string, string> = {};
        for (const issue of body.error.issues) {
          const campo = issue.path.join('.') || 'corpo';
          campos[campo] = 'acao (aceitar|recusar|concluir|cancelar) e atorId obrigatorios';
        }
        throw dadosInvalidos(campos);
      }

      const sessao = await changeStatus(
        repo,
        req.params.id as string,
        body.data.acao,
        body.data.atorId,
      );
      res.status(200).json(sessao);
    }),
  );

  return router;
}
