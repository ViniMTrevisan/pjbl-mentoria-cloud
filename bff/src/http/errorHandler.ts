import type { NextFunction, Request, Response } from 'express';
import { ErroDependencia } from '../application/errors';

interface ErroComTipo extends Error {
  type?: string;
  status?: number;
}

/**
 * Tradutor único de erro para HTTP. Nunca devolve stack nem detalhes internos;
 * falha de dependência vira 502 com o nome do serviço.
 */
export function errorHandler(
  erro: ErroComTipo,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(erro);
    return;
  }

  if (erro instanceof ErroDependencia) {
    res.status(502).json({ erro: 'serviço indisponível', servico: erro.servico });
    return;
  }

  if (erro.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'corpo JSON inválido' });
    return;
  }

  if (erro.type === 'entity.too.large') {
    res.status(413).json({ erro: 'corpo da requisição muito grande' });
    return;
  }

  const status = typeof erro.status === 'number' && erro.status >= 400 && erro.status < 500
    ? erro.status
    : 500;

  console.error('[bff] erro não tratado:', erro.message);
  res.status(status).json({ erro: status === 500 ? 'erro interno' : erro.message });
}

export function rotaNaoEncontrada(_req: Request, res: Response): void {
  res.status(404).json({ erro: 'rota não encontrada' });
}
