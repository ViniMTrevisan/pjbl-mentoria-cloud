import { Router } from 'express';
import { z } from 'zod';
import { dadosInvalidos } from '../domain/errors';
import type { AtualizarMentorInput } from '../domain/mentor';
import { createMentor } from '../application/createMentor';
import { listMentores } from '../application/listMentores';
import { getMentor } from '../application/getMentor';
import { updateMentor } from '../application/updateMentor';
import { deleteMentor } from '../application/deleteMentor';
import type { MentorRepository } from '../application/MentorRepository';
import { asyncHandler } from '../../../shared/http/errorHandler';

const querySchema = z.object({
  curso: z.string().optional(),
  materia: z.string().optional(),
  q: z.string().optional(),
});

export function mentoresRoutes(repo: MentorRepository): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = querySchema.safeParse(req.query);
      if (!query.success) {
        throw dadosInvalidos({ query: 'curso, materia e q devem ser textos' });
      }
      const resultado = await listMentores(repo, query.data);
      res.status(200).json(resultado);
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const mentor = await getMentor(repo, req.params.id as string);
      res.status(200).json(mentor);
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const mentor = await createMentor(repo, req.body);
      res.status(201).json(mentor);
    }),
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const mentor = await updateMentor(
        repo,
        req.params.id as string,
        (req.body ?? {}) as AtualizarMentorInput,
      );
      res.status(200).json(mentor);
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await deleteMentor(repo, req.params.id as string);
      res.status(204).send();
    }),
  );

  return router;
}
