/** Contrato OpenAPI do Servico de Sessoes (fonte: docs/entrega3/API-CONTRACTS.md). */
export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Servico de Sessoes',
    version: '1.0.0',
    description:
      'Agenda de sessoes de mentoria do PJBL. Persistencia em Azure SQL com outbox transacional para eventos CloudEvents.',
  },
  servers: [{ url: 'http://localhost:4002', description: 'Local' }],
  tags: [{ name: 'sessoes' }],
  paths: {
    '/health': {
      get: {
        tags: ['sessoes'],
        summary: 'Health check do processo e da dependencia SQL',
        responses: {
          '200': {
            description: 'Processo no ar (mesmo com banco indisponivel)',
            content: {
              'application/json': {
                example: {
                  status: 'ok',
                  servico: 'sessoes',
                  dependencia: { sql: 'ok' },
                },
              },
            },
          },
        },
      },
    },
    '/sessoes': {
      get: {
        tags: ['sessoes'],
        summary: 'Lista sessoes do usuario com filtro opcional de status',
        parameters: [
          { name: 'usuarioId', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: { $ref: '#/components/schemas/SessaoStatus' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de sessoes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['total', 'itens'],
                  properties: {
                    total: { type: 'integer' },
                    itens: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Sessao' },
                    },
                  },
                },
              },
            },
          },
          '422': { $ref: '#/components/responses/ErroValidacao' },
        },
      },
      post: {
        tags: ['sessoes'],
        summary: 'Solicita uma sessao',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mentorId', 'mentoradoId', 'dataHora', 'assunto'],
                properties: {
                  mentorId: { type: 'string', example: 'u2' },
                  mentoradoId: { type: 'string', example: 'u1' },
                  mentorNome: { type: 'string', example: 'Ana Beatriz Moraes' },
                  mentoradoNome: { type: 'string', example: 'Bruno Calouro' },
                  dataHora: {
                    type: 'string',
                    format: 'date-time',
                    example: '2026-10-22T17:00:00.000Z',
                  },
                  assunto: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 400,
                    example: 'Dúvida em árvores binárias',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Sessao solicitada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Sessao' },
              },
            },
          },
          '422': { $ref: '#/components/responses/ErroValidacao' },
        },
      },
    },
    '/sessoes/{id}': {
      get: {
        tags: ['sessoes'],
        summary: 'Detalhe da sessao',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Sessao',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Sessao' },
              },
            },
          },
          '404': { $ref: '#/components/responses/Erro' },
        },
      },
    },
    '/sessoes/{id}/status': {
      patch: {
        tags: ['sessoes'],
        summary: 'Aplica transicao de status',
        description:
          'aceitar/recusar: SOLICITADA e somente o mentor. cancelar: SOLICITADA ou ACEITA, qualquer participante. concluir: ACEITA, qualquer participante.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['acao', 'atorId'],
                properties: {
                  acao: {
                    type: 'string',
                    enum: ['aceitar', 'recusar', 'concluir', 'cancelar'],
                  },
                  atorId: { type: 'string', example: 'u2' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Sessao atualizada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Sessao' },
              },
            },
          },
          '403': { $ref: '#/components/responses/Erro' },
          '404': { $ref: '#/components/responses/Erro' },
          '409': { $ref: '#/components/responses/Erro' },
          '422': { $ref: '#/components/responses/ErroValidacao' },
        },
      },
    },
  },
  components: {
    schemas: {
      SessaoStatus: {
        type: 'string',
        enum: ['SOLICITADA', 'ACEITA', 'RECUSADA', 'CONCLUIDA', 'CANCELADA'],
      },
      Sessao: {
        type: 'object',
        required: [
          'id',
          'mentorId',
          'mentoradoId',
          'mentorNome',
          'mentoradoNome',
          'dataHora',
          'assunto',
          'status',
          'criadaEm',
          'atualizadaEm',
        ],
        properties: {
          id: { type: 'string' },
          mentorId: { type: 'string' },
          mentoradoId: { type: 'string' },
          mentorNome: { type: 'string' },
          mentoradoNome: { type: 'string' },
          dataHora: { type: 'string', format: 'date-time' },
          assunto: { type: 'string' },
          status: { $ref: '#/components/schemas/SessaoStatus' },
          criadaEm: { type: 'string', format: 'date-time' },
          atualizadaEm: { type: 'string', format: 'date-time' },
        },
      },
      Erro: {
        type: 'object',
        required: ['erro'],
        properties: { erro: { type: 'string' } },
      },
      ErroValidacao: {
        type: 'object',
        required: ['erro', 'campos'],
        properties: {
          erro: { type: 'string' },
          campos: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
      },
    },
    responses: {
      Erro: {
        description: 'Erro de negocio',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
          },
        },
      },
      ErroValidacao: {
        description: 'Dados invalidos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErroValidacao' },
          },
        },
      },
    },
  },
};
