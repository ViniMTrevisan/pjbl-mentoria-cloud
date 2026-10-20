/** Erro de dominio com codigo estavel e status HTTP associado. */
export class DomainError extends Error {
  readonly codigo: string;
  readonly status: number;
  readonly campos?: Record<string, string>;

  constructor(
    codigo: string,
    status: number,
    mensagem: string,
    campos?: Record<string, string>,
  ) {
    super(mensagem);
    this.name = 'DomainError';
    this.codigo = codigo;
    this.status = status;
    this.campos = campos;
  }
}

export function dadosInvalidos(campos: Record<string, string>): DomainError {
  return new DomainError('DADOS_INVALIDOS', 422, 'Dados invalidos', campos);
}

export function naoEncontrado(recurso: string): DomainError {
  return new DomainError('NAO_ENCONTRADO', 404, `${recurso} nao encontrado`);
}

export function proibido(mensagem: string): DomainError {
  return new DomainError('SEM_PERMISSAO', 403, mensagem);
}

export function conflito(mensagem: string): DomainError {
  return new DomainError('CONFLITO', 409, mensagem);
}
