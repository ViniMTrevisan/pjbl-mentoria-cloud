/** Erro de domínio com código estável e status HTTP associado. */
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
