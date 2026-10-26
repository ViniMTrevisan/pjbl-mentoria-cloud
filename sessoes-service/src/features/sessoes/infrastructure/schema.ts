import type { SqlRepositoryConfig } from '../../../shared/config';

export type { SqlRepositoryConfig };

/** Tabelas do servico. Idempotente: cria apenas quando nao existem. */
export const SQL_SCHEMA = `
IF OBJECT_ID(N'dbo.SESSAO', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.SESSAO (
    id NVARCHAR(36) NOT NULL CONSTRAINT pk_sessao PRIMARY KEY,
    mentor_id NVARCHAR(64) NOT NULL,
    mentorado_id NVARCHAR(64) NOT NULL,
    mentor_nome NVARCHAR(120) NOT NULL,
    mentorado_nome NVARCHAR(120) NOT NULL,
    data_hora DATETIME2 NOT NULL,
    assunto NVARCHAR(400) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    criada_em DATETIME2 NOT NULL,
    atualizada_em DATETIME2 NOT NULL,
    rowversion ROWVERSION NOT NULL
  );
  CREATE INDEX idx_sessao_mentor ON dbo.SESSAO (mentor_id);
  CREATE INDEX idx_sessao_mentorado ON dbo.SESSAO (mentorado_id);
  CREATE INDEX idx_sessao_status ON dbo.SESSAO (status);
END;

IF OBJECT_ID(N'dbo.OUTBOX_EVENTO', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.OUTBOX_EVENTO (
    id NVARCHAR(36) NOT NULL CONSTRAINT pk_outbox_evento PRIMARY KEY,
    tipo NVARCHAR(40) NOT NULL,
    sessao_id NVARCHAR(36) NOT NULL,
    payload NVARCHAR(MAX) NOT NULL,
    criado_em DATETIME2 NOT NULL,
    publicado_em DATETIME2 NULL
  );
  CREATE INDEX idx_outbox_pendente ON dbo.OUTBOX_EVENTO (publicado_em, criado_em);
END;
`;
