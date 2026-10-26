/** Contrato OpenAPI do Servico de Mentores (fonte: docs/entrega3/API-CONTRACTS.md). */
export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Servico de Mentores',
    version: '1.0.0',
    description:
      'Catalogo de mentores do PJBL Mentoria. Documentos no MongoDB, ids iguais aos usuarios simulados (u2..u5).',
  },
  servers: [{ url: 'http://localhost:4001', description: 'Local' }],
  tags: [{ name: 'mentores' }],
  paths: {
    '/health': {
      get: {
        tags: ['mentores'],
        summary: 'Health check do processo',
        responses: {
          '200': {
            description: 'Servico no ar',
            content: {
              'application/json': {
                example: {
                  status: 'ok',
                  servico: 'mentores',
                  dependencia: { banco: 'ok' },
                },
              },
            },
          },
        },
      },
    },
    '/mentores': {
      get: {
        tags: ['mentores'],
        summary: 'Lista mentores visiveis com filtros',
        parameters: [
          { name: 'curso', in: 'query', schema: { type: 'string' } },
          { name: 'materia', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Lista paginada logicamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['total', 'itens'],
                  properties: {
                    total: { type: 'integer' },
                    itens: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MentorResumo' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['mentores'],
        summary: 'Cria mentor',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MentorInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Mentor criado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mentor' },
              },
            },
          },
          '422': { $ref: '#/components/responses/ErroValidacao' },
        },
      },
    },
    '/mentores/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      get: {
        tags: ['mentores'],
        summary: 'Detalhe do mentor',
        responses: {
          '200': {
            description: 'Mentor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mentor' },
              },
            },
          },
          '404': { $ref: '#/components/responses/Erro' },
        },
      },
      put: {
        tags: ['mentores'],
        summary: 'Atualiza campos parciais',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MentorInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Mentor atualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mentor' },
              },
            },
          },
          '404': { $ref: '#/components/responses/Erro' },
          '422': { $ref: '#/components/responses/ErroValidacao' },
        },
      },
      delete: {
        tags: ['mentores'],
        summary: 'Remove mentor',
        responses: {
          '204': { description: 'Removido' },
          '404': { $ref: '#/components/responses/Erro' },
        },
      },
    },
    '/mentores/{id}/avaliacoes': {
      post: {
        tags: ['mentores'],
        summary: 'Registra avaliacao de uma sessao',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sessaoId', 'nota'],
                properties: {
                  sessaoId: { type: 'string', example: 's1' },
                  nota: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                  comentario: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Avaliacao criada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Avaliacao' },
              },
            },
          },
          '404': { $ref: '#/components/responses/Erro' },
          '409': { $ref: '#/components/responses/Erro' },
          '422': { $ref: '#/components/responses/ErroValidacao' },
        },
      },
    },
  },
  components: {
    schemas: {
      Area: {
        type: 'object',
        required: ['id', 'curso', 'materia'],
        properties: {
          id: { type: 'string' },
          curso: { type: 'string' },
          materia: { type: 'string' },
        },
      },
      Disponibilidade: {
        type: 'object',
        required: ['id', 'diaSemana', 'horaInicio', 'horaFim'],
        properties: {
          id: { type: 'string' },
          diaSemana: { type: 'integer', minimum: 0, maximum: 6 },
          horaInicio: { type: 'string', example: '14:00' },
          horaFim: { type: 'string', example: '16:00' },
        },
      },
      Avaliacao: {
        type: 'object',
        required: ['id', 'sessaoId', 'nota', 'criadaEm'],
        properties: {
          id: { type: 'string' },
          sessaoId: { type: 'string' },
          nota: { type: 'integer', minimum: 1, maximum: 5 },
          comentario: { type: 'string' },
          criadaEm: { type: 'string', format: 'date-time' },
        },
      },
      Mentor: {
        type: 'object',
        required: [
          'id',
          'nome',
          'email',
          'curso',
          'bio',
          'ehMentor',
          'ehMentorado',
          'areas',
          'disponibilidades',
          'avaliacoes',
          'criadoEm',
          'atualizadoEm',
        ],
        properties: {
          id: { type: 'string' },
          nome: { type: 'string' },
          email: { type: 'string', format: 'email' },
          curso: { type: 'string' },
          periodo: { type: 'integer', minimum: 1, maximum: 12 },
          bio: { type: 'string' },
          ehMentor: { type: 'boolean' },
          ehMentorado: { type: 'boolean' },
          areas: { type: 'array', items: { $ref: '#/components/schemas/Area' } },
          disponibilidades: {
            type: 'array',
            items: { $ref: '#/components/schemas/Disponibilidade' },
          },
          avaliacoes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Avaliacao' },
          },
          criadoEm: { type: 'string', format: 'date-time' },
          atualizadoEm: { type: 'string', format: 'date-time' },
        },
      },
      MentorResumo: {
        type: 'object',
        required: [
          'id',
          'nome',
          'curso',
          'periodo',
          'bio',
          'areas',
          'disponibilidades',
          'notas',
          'totalAvaliacoes',
        ],
        properties: {
          id: { type: 'string' },
          nome: { type: 'string' },
          curso: { type: 'string' },
          periodo: { type: 'integer', nullable: true },
          bio: { type: 'string' },
          areas: { type: 'array', items: { $ref: '#/components/schemas/Area' } },
          disponibilidades: {
            type: 'array',
            items: { $ref: '#/components/schemas/Disponibilidade' },
          },
          notas: { type: 'array', items: { type: 'integer' } },
          totalAvaliacoes: { type: 'integer' },
        },
      },
      MentorInput: {
        type: 'object',
        required: ['nome', 'email'],
        properties: {
          nome: { type: 'string' },
          email: { type: 'string', format: 'email' },
          curso: { type: 'string' },
          periodo: { type: 'integer', minimum: 1, maximum: 12 },
          bio: { type: 'string' },
          areas: {
            type: 'array',
            items: {
              type: 'object',
              required: ['curso', 'materia'],
              properties: {
                id: { type: 'string' },
                curso: { type: 'string' },
                materia: { type: 'string' },
              },
            },
          },
          disponibilidades: {
            type: 'array',
            items: {
              type: 'object',
              required: ['diaSemana', 'horaInicio', 'horaFim'],
              properties: {
                id: { type: 'string' },
                diaSemana: { type: 'integer', minimum: 0, maximum: 6 },
                horaInicio: { type: 'string' },
                horaFim: { type: 'string' },
              },
            },
          },
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
