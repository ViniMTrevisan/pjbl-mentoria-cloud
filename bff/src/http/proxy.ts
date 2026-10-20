import type { Request, Response } from 'express';
import type { RespostaBruta } from '../infrastructure/clients/httpClient';
import type { EntradaProxy, ServicoProxy } from '../infrastructure/clients/servicoProxy';
import { querySimples, resolverUsuarioId } from './usuario';

export type MetodoProxy = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Repassa status, content-type e corpo do serviço, sem reinterpretar o payload. */
export function responderProxy(res: Response, resposta: RespostaBruta): void {
  if (resposta.status === 204 || resposta.texto.length === 0) {
    res.status(resposta.status).end();
    return;
  }
  if (resposta.tipoConteudo) res.setHeader('Content-Type', resposta.tipoConteudo);
  res.status(resposta.status).send(resposta.texto);
}

export interface OpcoesProxy {
  metodo: MetodoProxy;
  /** Monta o caminho no serviço interno a partir da requisição. */
  caminho: (req: Request) => string;
  /** `X-Usuario-Id` resolvido também vai como query (só onde o serviço filtra). */
  usuarioIdNaQuery?: boolean;
}

export function criarProxyHandler(
  proxy: ServicoProxy,
  opcoes: OpcoesProxy,
): (req: Request, res: Response, next: (erro?: unknown) => void) => Promise<void> {
  return async (req, res, next) => {
    try {
      const usuarioId = resolverUsuarioId(req);
      const query = querySimples(req);
      if (opcoes.usuarioIdNaQuery) query.usuarioId = usuarioId;

      const entrada: EntradaProxy = {
        caminho: opcoes.caminho(req),
        query,
        corpo: opcoes.metodo === 'GET' || opcoes.metodo === 'DELETE' ? undefined : req.body,
        usuarioId,
      };

      const resposta = await proxy.encaminhar(opcoes.metodo, entrada);
      responderProxy(res, resposta);
    } catch (erro) {
      next(erro);
    }
  };
}
