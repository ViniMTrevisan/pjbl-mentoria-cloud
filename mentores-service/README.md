# Serviço de Mentores

Microsserviço responsável pelo catálogo de mentores do PJBL Mentoria. Persiste documentos
no MongoDB (`pjbl_mentoria.mentores`) e expõe a API consumida pelo BFF, pelo gateway e pelos
microfrontends. Contrato de referência: `docs/entrega3/API-CONTRACTS.md`.

- Porta padrão: **4001**
- Banco: **MongoDB** (fallback em memória quando `MONGODB_URI` não está definido)
- Node 22, TypeScript 5.6 strict, CommonJS

## Arquitetura

Clean Architecture + Vertical Slice. `domain` é puro, `features` tem um arquivo por caso de
uso e a infraestrutura é escolhida no composition root (`src/server.ts`).

```text
mentores-service/
├── src/
│   ├── features/                    # vertical slices (uma capacidade por pasta)
│   │   ├── mentores/                # fatia do agregado de mentores
│   │   │   ├── domain/              # regras puras, sem imports externos
│   │   │   │   ├── mentor.ts        # tipos Mentor, MentorResumo, Area...
│   │   │   │   ├── errors.ts        # erros do slice (422/404/409)
│   │   │   │   ├── validation.ts    # validarMentor, filtrarMentores, toResumo
│   │   │   │   └── mentorFactory.ts # novoMentor, aplicarAlteracoes
│   │   │   ├── application/         # casos de uso + porta de saída
│   │   │   │   ├── MentorRepository.ts
│   │   │   │   ├── createMentor.ts
│   │   │   │   ├── listMentores.ts
│   │   │   │   ├── getMentor.ts
│   │   │   │   ├── updateMentor.ts
│   │   │   │   └── deleteMentor.ts
│   │   │   ├── infrastructure/      # adaptadores (Mongo, memória, seed)
│   │   │   │   ├── MongoMentorRepository.ts
│   │   │   │   ├── InMemoryMentorRepository.ts
│   │   │   │   └── mentoresSeed.ts
│   │   │   └── presentation/mentoresRoutes.ts
│   │   └── avaliacoes/              # fatia de avaliação de mentor
│   │       ├── domain/avaliacoes.ts # adicionarAvaliacao (duplicidade = 409)
│   │       ├── application/addAvaliacao.ts
│   │       └── presentation/avaliacoesRoutes.ts
│   ├── shared/                      # kernel compartilhado (sem conhecer slices)
│   │   ├── domain/DomainError.ts    # erro base do domínio
│   │   ├── domain/texto.ts          # normalização de busca e ids
│   │   ├── http/                    # errorHandler, openapi, /health
│   │   └── config.ts                # leitura de env
│   ├── app.ts                       # composition root (Express + slices)
│   └── server.ts                    # bootstrap (Mongo x memória)
├── scripts/seed.ts                  # seed idempotente (upsert por id)
├── test/                            # vitest: domínio, casos de uso e arquitetura
├── vitest.config.ts                 # globals (exigido pelo ArchUnitTS)
└── Dockerfile                       # multi-stage node:22-alpine, non-root
```

Regras verificadas pelo ArchUnitTS (`test/architecture.test.ts`):

- `domain` não depende de `application`, `infrastructure` nem `presentation`;
- `application` não depende de `infrastructure` nem de `presentation`;
- `presentation` não depende de `infrastructure` (usa as portas da aplicação);
- um slice não acessa `infrastructure`/`presentation` de outro slice;
- `shared` não conhece nenhum slice e `domain` não importa frameworks;
- não existem dependências circulares em `src`.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/mentores?curso=&materia=&q=` | Lista `{total, itens: MentorResumo[]}`; apenas `ehMentor=true` e com área |
| GET | `/mentores/:id` | Detalhe (`200`) ou `404` |
| POST | `/mentores` | Cria (`201`) ou `422 {erro, campos}` |
| PUT | `/mentores/:id` | Atualiza campos parciais (`200/404/422`) |
| DELETE | `/mentores/:id` | Remove (`204/404`) |
| POST | `/mentores/:id/avaliacoes` | Cria avaliação (`201`), duplicada `409`, inválida `422` |
| GET | `/health` | `{status:"ok", servico:"mentores", dependencia:{banco}}` |
| GET | `/openapi.json` | OpenAPI 3 |
| GET | `/docs` | Swagger UI |

`MentorResumo` inclui `notas: number[]` e `totalAvaliacoes`, usados no cálculo de reputação
em lote pela Azure Function.

Busca (`q`) procura em nome, bio e matéria, sem diferenciar caixa ou acentos. `curso` e
`materia` filtram as áreas do mentor.

## Rodando com Docker

```bash
docker build -t mentores-service .
docker run --rm -p 4001:4001 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017" \
  -e MONGODB_DB=pjbl_mentoria \
  -e SEED_ON_START=true \
  mentores-service
```

O `docker-compose.yml` da raiz orquestra este serviço junto do MongoDB e demais componentes.

## Rodando sem Docker

```bash
npm install
npm run dev          # tsx watch, porta 4001
```

Sem `MONGODB_URI` o serviço sobe com `InMemoryMentorRepository` já populado com os dados de
seed — útil para testar o BFF e os microfrontends sem banco.

Com MongoDB local:

```bash
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB=pjbl_mentoria
npm run build && npm start
```

O serviço cria os índices (`id` único e `nome`) no boot. Quando `SEED_ON_START=true` e a
coleção está vazia, insere os 4 mentores do contrato (u2 Ana Beatriz, u3 João Vitor, u4
Mariana, u5 Fernanda) com avaliações coerentes. u1 é apenas mentorado e não vira documento.

Seed manual idempotente (upsert por `id`):

```bash
MONGODB_URI="mongodb://localhost:27017" npm run seed
```

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `MONGODB_URI` | — | String de conexão; ausente ⇒ repositório em memória |
| `MONGODB_DB` | `pjbl_mentoria` | Nome do banco |
| `PORT` | `4001` | Porta HTTP |
| `SEED_ON_START` | `true` | Popula a coleção vazia no boot |
| `CORS_ORIGIN` | `*` | Origem(ens) permitida(s), separadas por vírgula |

## Testes

```bash
npm test          # vitest run (domínio, casos de uso e arquitetura)
npm run test:arch # só as regras de arquitetura (ArchUnitTS)
```

Cobrem validação de domínio, criação/atualização, filtros, duplicidade de avaliação e os
casos de uso com repositório em memória.

## Decisões

- Validação de regra de negócio fica no `domain`; zod valida apenas o envelope HTTP.
- `MentorRepository` recebe o documento já montado pelo domínio; adaptadores não conhecem
  regra de negócio.
- Erros de driver nunca chegam ao cliente: o handler responde `500 {erro:"Erro interno"}`.
- Datas são sempre ISO-8601 UTC; a UI formata em `America/Sao_Paulo`.

## Alunos

- Bento Barp
- Guilherme Reis
- Guilherme Selenko
- Vinicius Trevisan
