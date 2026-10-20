/** Documento OpenAPI 3 do BFF, servido em /openapi.json e renderizado em /docs. */
export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'BFF — PjBL Mentoria',
    version: '1.0.0',
    description:
      'Backend for Frontend da arquitetura de microservices. Agrega mentores, sessões e reputação ' +
      'e faz proxy das operações para os serviços internos. Todas as datas em ISO-8601 UTC.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local' }],
  tags: [
    { name: 'Agregação', description: 'Leitura otimizada para a tela inicial' },
    { name: 'Mentores', description: 'Proxy para o Serviço de Mentores' },
    { name: 'Sessões', description: 'Proxy para o Serviço de Sessões' },
    { name: 'Eventos', description: 'Proxy para o sink de eventos da Function' },
    { name: 'Operação', description: 'Saúde e contrato' },
  ],
  components: {
    parameters: {
      UsuarioIdHeader: {
        name: 'X-Usuario-Id',
        in: 'header',
        required: false,
        schema: { type: 'string', default: 'u1' },
        description: 'Identidade simulada. Padrão u1 (Bruno Calouro).',
      },
    },
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
      Reputacao: {
        type: 'object',
        properties: {
          media: { type: 'number', nullable: true, example: 4.8 },
          total: { type: 'integer', example: 5 },
          distribuicao: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            example: { '1': 0, '2': 0, '3': 1, '4': 1, '5': 3 },
          },
          selo: { type: 'string', enum: ['novo', 'confiavel', 'excelente'] },
          semAvaliacoes: { type: 'boolean' },
        },
      },
      MentorResumo: {
        type: 'object',
        required: ['id', 'nome', 'areas', 'notas'],
        properties: {
          id: { type: 'string', example: 'u2' },
          nome: { type: 'string' },
          email: { type: 'string', format: 'email' },
          curso: { type: 'string' },
          periodo: { type: 'integer', nullable: true },
          bio: { type: 'string' },
          areas: { type: 'array', items: { $ref: '#/components/schemas/Area' } },
          disponibilidades: {
            type: 'array',
            items: { $ref: '#/components/schemas/Disponibilidade' },
          },
          notas: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 5 } },
          totalAvaliacoes: { type: 'integer' },
        },
      },
      MentorComReputacao: {
        allOf: [
          { $ref: '#/components/schemas/MentorResumo' },
          {
            type: 'object',
            properties: {
              reputacao: {
                allOf: [{ $ref: '#/components/schemas/Reputacao' }],
                nullable: true,
              },
            },
          },
        ],
      },
      Sessao: {
        type: 'object',
        required: ['id', 'mentorId', 'mentoradoId', 'dataHora', 'status'],
        properties: {
          id: { type: 'string' },
          mentorId: { type: 'string' },
          mentoradoId: { type: 'string' },
          mentorNome: { type: 'string' },
          mentoradoNome: { type: 'string' },
          dataHora: { type: 'string', format: 'date-time' },
          assunto: { type: 'string' },
          status: {
            type: 'string',
            enum: ['SOLICITADA', 'ACEITA', 'RECUSADA', 'CONCLUIDA', 'CANCELADA'],
          },
          criadaEm: { type: 'string', format: 'date-time' },
          atualizadaEm: { type: 'string', format: 'date-time' },
        },
      },
      EntradaSessao: {
        type: 'object',
        required: ['mentorId', 'mentoradoId', 'dataHora', 'assunto'],
        properties: {
          mentorId: { type: 'string' },
          mentoradoId: { type: 'string' },
          mentorNome: { type: 'string' },
          mentoradoNome: { type: 'string' },
          dataHora: { type: 'string', format: 'date-time' },
          assunto: { type: 'string' },
        },
      },
      EntradaStatus: {
        type: 'object',
        required: ['acao', 'atorId'],
        properties: {
          acao: { type: 'string', enum: ['aceitar', 'recusar', 'concluir', 'cancelar'] },
          atorId: { type: 'string' },
        },
      },
      EntradaAvaliacao: {
        type: 'object',
        required: ['sessaoId', 'nota'],
        properties: {
          sessaoId: { type: 'string' },
          nota: { type: 'integer', minimum: 1, maximum: 5 },
          comentario: { type: 'string' },
        },
      },
      Evento: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          source: { type: 'string' },
          time: { type: 'string', format: 'date-time' },
          data: { type: 'object', additionalProperties: true },
        },
      },
      AggregatedData: {
        type: 'object',
        properties: {
          geradoEm: { type: 'string', format: 'date-time' },
          usuarioId: { type: 'string' },
          mentores: {
            type: 'array',
            items: { $ref: '#/components/schemas/MentorComReputacao' },
          },
          sessoes: {
            type: 'object',
            properties: {
              proximas: { type: 'array', items: { $ref: '#/components/schemas/Sessao' } },
              historico: { type: 'array', items: { $ref: '#/components/schemas/Sessao' } },
              total: { type: 'integer' },
            },
          },
          resumo: {
            type: 'object',
            properties: {
              totalMentores: { type: 'integer' },
              totalSessoes: { type: 'integer' },
              sessoesPendentes: { type: 'integer' },
              mediaReputacao: { type: 'number', nullable: true },
            },
          },
          eventos: { type: 'array', items: { $ref: '#/components/schemas/Evento' } },
          parcial: { type: 'boolean' },
          falhas: {
            type: 'array',
            items: { type: 'string', enum: ['mentores', 'sessoes', 'reputacao'] },
          },
        },
      },
      Saude: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'degradado'] },
          dependencias: {
            type: 'object',
            properties: {
              mentores: { type: 'string', enum: ['ok', 'fora'] },
              sessoes: { type: 'string', enum: ['ok', 'fora'] },
              function: { type: 'string', enum: ['ok', 'fora'] },
            },
          },
        },
      },
      Erro: {
        type: 'object',
        properties: {
          erro: { type: 'string' },
          servico: { type: 'string' },
          campos: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  paths: {
    '/aggregated-data': {
      get: {
        tags: ['Agregação'],
        summary: 'Dados agregados da tela inicial',
        description:
          'Chama mentores, sessões e Function em paralelo. Falha de dependência não gera 5xx: ' +
          'a resposta vem parcial com o nome do serviço em `falhas`.',
        parameters: [
          { $ref: '#/components/parameters/UsuarioIdHeader' },
          {
            name: 'usuarioId',
            in: 'query',
            schema: { type: 'string', default: 'u1' },
            description: 'Sobrescreve o header quando o header não vem.',
          },
        ],
        responses: {
          '200': {
            description: 'Agregado (possivelmente parcial)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AggregatedData' } },
            },
          },
        },
      },
    },
    '/mentores': {
      get: {
        tags: ['Mentores'],
        summary: 'Lista mentores com filtros',
        parameters: [
          { name: 'curso', in: 'query', schema: { type: 'string' } },
          { name: 'materia', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { $ref: '#/components/parameters/UsuarioIdHeader' },
        ],
        responses: {
          '200': { description: 'Lista de mentores' },
          '502': { description: 'Serviço indisponível', content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } } },
        },
      },
      post: {
        tags: ['Mentores'],
        summary: 'Cria mentor',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Criado' }, '422': { description: 'Validação' } },
      },
    },
    '/mentores/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Mentores'],
        summary: 'Detalha mentor',
        responses: { '200': { description: 'Mentor' }, '404': { description: 'Não encontrado' } },
      },
      put: {
        tags: ['Mentores'],
        summary: 'Atualiza mentor',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Atualizado' }, '422': { description: 'Validação' } },
      },
      delete: {
        tags: ['Mentores'],
        summary: 'Remove mentor',
        responses: { '204': { description: 'Removido' }, '404': { description: 'Não encontrado' } },
      },
    },
    '/mentores/{id}/avaliacoes': {
      post: {
        tags: ['Mentores'],
        summary: 'Registra avaliação de uma sessão',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EntradaAvaliacao' } } },
        },
        responses: {
          '201': { description: 'Avaliação criada' },
          '409': { description: 'Sessão já avaliada' },
          '422': { description: 'Nota inválida' },
        },
      },
    },
    '/sessoes': {
      get: {
        tags: ['Sessões'],
        summary: 'Lista sessões do usuário',
        parameters: [
          { $ref: '#/components/parameters/UsuarioIdHeader' },
          { name: 'usuarioId', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['SOLICITADA', 'ACEITA', 'RECUSADA', 'CONCLUIDA', 'CANCELADA'] },
          },
        ],
        responses: { '200': { description: 'Sessões' }, '502': { description: 'Serviço indisponível' } },
      },
      post: {
        tags: ['Sessões'],
        summary: 'Solicita sessão',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EntradaSessao' } } },
        },
        responses: { '201': { description: 'Solicitada' }, '422': { description: 'Validação' } },
      },
    },
    '/sessoes/{id}/status': {
      patch: {
        tags: ['Sessões'],
        summary: 'Transiciona status da sessão',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EntradaStatus' } } },
        },
        responses: {
          '200': { description: 'Status atualizado' },
          '403': { description: 'Ator sem permissão' },
          '404': { description: 'Sessão não encontrada' },
          '409': { description: 'Transição inválida' },
        },
      },
    },
    '/eventos': {
      get: {
        tags: ['Eventos'],
        summary: 'Últimos eventos de domínio',
        parameters: [{ name: 'limite', in: 'query', schema: { type: 'integer', default: 50 } }],
        responses: { '200': { description: 'Eventos' }, '502': { description: 'Function indisponível' } },
      },
    },
    '/health': {
      get: {
        tags: ['Operação'],
        summary: 'Saúde do BFF e das dependências',
        responses: {
          '200': {
            description: 'Estado das dependências',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Saude' } } },
          },
        },
      },
    },
  },
} as const;

export const openapiJson = JSON.stringify(openapiDocument);
