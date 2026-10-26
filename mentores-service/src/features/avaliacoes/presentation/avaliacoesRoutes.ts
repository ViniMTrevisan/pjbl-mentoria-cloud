import { Router } from 'express';
import type { CriarAvaliacaoInput } from '../../mentores/domain/mentor';
import type { MentorRepository } from '../../mentores/application/MentorRepository';
import { addAvaliacao } from '../application/addAvaliacao';
import { asyncHandler } from '../../../shared/http/errorHandler';

/** Slice `avaliacoes`: entrada HTTP da avaliação de um mentor. */
export function avaliacoesRoutes(repo: MentorRepository): Router {
  const router = Router();

  router.post(
    '/:id/avaliacoes',
    asyncHandler(async (req, res) => {
      const avaliacao = await addAvaliacao(
        repo,
        req.params.id as string,
        (req.body ?? {}) as CriarAvaliacaoInput,
      );
      res.status(201).json(avaliacao);
    }),
  );

  return router;
}
