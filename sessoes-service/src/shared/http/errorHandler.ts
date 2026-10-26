import type { ErrorRequestHandler, RequestHandler } from 'express';
import { DomainError } from '../domain/DomainError';

export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export const errorHandler: ErrorRequestHandler = (erro, _req, res, _next) => {
  if (erro instanceof DomainError) {
    res.status(erro.status).json({
      erro: erro.message,
      ...(erro.campos ? { campos: erro.campos } : {}),
    });
    return;
  }

  const tipo = (erro as { type?: string } | null)?.type;
  if (tipo === 'entity.parse.failed') {
    res.status(400).json({ erro: 'JSON invalido' });
    return;
  }
  if (tipo === 'entity.too.large') {
    res.status(413).json({ erro: 'Corpo da requisicao muito grande' });
    return;
  }

  console.error(`[sessoes] erro inesperado: ${(erro as Error)?.name ?? 'Error'}`);
  res.status(500).json({ erro: 'Erro interno' });
};

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ erro: 'Rota nao encontrada' });
};
