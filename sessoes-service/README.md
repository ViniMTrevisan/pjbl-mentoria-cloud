# Serviço de Sessões

Microsserviço responsável pela agenda de sessões de mentoria do PJBL Mentoria. Persiste em
**Azure SQL / SQL Server** (tabelas `SESSAO` e `OUTBOX_EVENTO`) e publica eventos de domínio
em um sink HTTP (Azure Function). Contrato de referência: `docs/entrega3/API-CONTRACTS.md`.

- Porta padrão: **4002**
- Banco: **Azure SQL / SQL Server** (fallback em memória quando `SQL_SERVER` não está definido)
- Node 22, TypeScript 5.6 strict, CommonJS

## Arquitetura

Clean Architecture + Vertical Slice. O domínio contém a máquina de estados; os casos de uso
orquestram repositório e outbox, ambos atrás de portas.

```text
sessoes-service/
├── src/
│   ├── domain/                 # regras puras (sem imports externos)
│   │   ├── sessao.ts           # Sessao, status, ações, eventos
│   │   ├── errors.ts           # DomainError (422/403/404/409)
│   │   ├── validation.ts       # validarCriacao, filtros de status
│   │   ├── stateMachine.ts     # aceitar/recusar/cancelar/concluir
│   │   ├── events.ts           # CloudEvents-like + linha do outbox
│   │   └── texto.ts            # ids e utilitários
│   ├── ports/
│   │   └── SessaoRepository.ts # SessaoRepository + OutboxRepository
│   ├── features/
│   │   ├── createSessao.ts
│   │   ├── listSessoes.ts
│   │   ├── getSessao.ts
│   │   ├── changeStatus.ts
│   │   └── relayOutbox.ts
│   ├── infrastructure/
│   │   ├── sql/
│   │   │   ├── SqlSessaoRepository.ts
│   │   │   ├── connection.ts   # retry 10x com backoff de 2s
│   │   │   └── schema.ts       # DDL idempotente (SESSAO + OUTBOX_EVENTO)
│   │   ├── memory/InMemorySessaoRepository.ts
│   │   └── seed/sessoesSeed.ts
│   ├── http/
│   │   ├── app.ts
│   │   ├── openapi.ts
│   │   ├── errorHandler.ts
│   │   └── routes/sessoesRoutes.ts
│   ├── config.ts
│   └── server.ts               # composition root + relay a cada 2s
├── scripts/seed.ts             # seed idempotente por id
├── test/                       # vitest: domínio, casos de uso e relay
├── .dependency-cruiser.cjs
└── Dockerfile                  # multi-stage node:22-alpine, non-root
```

Regras verificadas por `depcruise`:

- `domain` não importa nada fora de `domain`;
- `features` não importa `infrastructure`, `http` nem drivers;
- `ports` não importa `infrastructure`;
- `infrastructure` não importa `http`.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/sessoes?usuarioId=&status=` | `{total, itens: Sessao[]}` filtrado por participante e status |
| GET | `/sessoes/:id` | Detalhe (`200/404`) |
| POST | `/sessoes` | Cria `SOLICITADA` (`201/422`) |
| PATCH | `/sessoes/:id/status` | `{acao, atorId}` (`200/403/404/409/422`) |
| GET | `/health` | `200 {status:"ok", servico:"sessoes", dependencia:{sql}}` |
| GET | `/openapi.json` | OpenAPI 3 |
| GET | `/docs` | Swagger UI |

### Máquina de estados

| Ação | Status de origem | Quem pode | Destino |
|---|---|---|---|
| `aceitar` | `SOLICITADA` | somente o mentor | `ACEITA` |
| `recusar` | `SOLICITADA` | somente o mentor | `RECUSADA` |
| `cancelar` | `SOLICITADA`, `ACEITA` | qualquer participante | `CANCELADA` |
| `concluir` | `ACEITA` | qualquer participante | `CONCLUIDA` |

Ator que não participa → `403`. Transição fora da tabela → `409`. A atualização usa
`UPDATE ... WHERE id=@id AND status=@statusEsperado`: se nenhuma linha for afetada, outra
requisição venceu a corrida e a resposta é `409`.

### Outbox

Cada transição grava a sessão e o evento na mesma transação. O relay roda a cada 2s, pega até
20 pendentes e faz `POST ${EVENT_SINK_URL}/api/eventos`. Resposta 2xx marca `publicado_em`;
erro, timeout ou sink fora mantêm a linha pendente (entrega *at-least-once*), sem derrubar o
processo. Tipos: `SessaoSolicitada`, `SessaoAceita`, `SessaoRecusada`, `SessaoCancelada`,
`SessaoConcluida`.

## Rodando com Docker

```bash
docker build -t sessoes-service .
docker run --rm -p 4002:4002 \
  -e SQL_SERVER=host.docker.internal \
  -e SQL_DATABASE=pjbl_mentoria \
  -e SQL_USER=sa \
  -e SQL_PASSWORD="<sua-senha>" \
  -e EVENT_SINK_URL=http://host.docker.internal:7071 \
  sessoes-service
```

O `docker-compose.yml` da raiz sobe o SQL Server 2022, espera o healthcheck e injeta as
variáveis. O schema é criado no boot com `IF OBJECT_ID(...) IS NULL`.

## Rodando sem Docker

```bash
npm install
npm run dev          # tsx watch, porta 4002
```

Sem `SQL_SERVER` o serviço usa `InMemorySessaoRepository` (com as 4 sessões de seed e outbox
em memória). Com SQL Server local, informe as variáveis e rode:

```bash
npm run build && npm start
```

Seed manual (insere apenas ids inexistentes):

```bash
SQL_SERVER=localhost SQL_PASSWORD="<sua-senha>" npm run seed
```

### Seed automático

Com `SEED_ON_START=true` e a tabela vazia, insere 4 sessões: `SOLICITADA` (u1/u2), `ACEITA`
(u1/u4), `CONCLUIDA` (u1/u3) e `RECUSADA` (u1/u5), com datas coerentes com o contrato.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `SQL_SERVER` | — | Host do SQL; ausente ⇒ repositório em memória |
| `SQL_PORT` | `1433` | Porta do SQL Server |
| `SQL_DATABASE` | `pjbl_mentoria` | Banco |
| `SQL_USER` | `sa` | Usuário |
| `SQL_PASSWORD` | — | Senha (obrigatória quando `SQL_SERVER` existe) |
| `SQL_ENCRYPT` | `false` | TLS; SQL Server 2022 local aceita `false` |
| `PORT` | `4002` | Porta HTTP |
| `EVENT_SINK_URL` | `http://azure-function:80` no compose / `http://localhost:7071` fora | Base do sink de eventos |
| `SEED_ON_START` | `true` | Popula a tabela vazia no boot |
| `CORS_ORIGIN` | `*` | Origem(ens) permitida(s) |

## Testes

```bash
npm test         # vitest run + dependency-cruiser
npm run test:arch
```

Cobrem validação de criação, máquina de estados (incluindo `403` e `409`), casos de uso com
repositório em memória, conflito de concorrência e relay do outbox (sucesso, sink fora e
resposta de erro).

## Decisões

- A máquina de estados vive no domínio e recebe `atorId`; o HTTP não decide permissão.
- `atualizarStatus` é atômico com a checagem de status esperado e o insert do outbox na mesma
  transação.
- Se o banco estiver fora, `/health` continua respondendo `200` com
  `dependencia.sql = "indisponivel"`, para o orquestrador não confundir processo morto com
  dependência degradada.
- `mentorNome`/`mentoradoNome` são opcionais na criação e caem para o id quando omitidos, para
  não quebrar chamadas do BFF que só enviam os ids.
- Datas são sempre ISO-8601 UTC; o SQL usa `DATETIME2` com `useUTC`.

## Alunos

- Bento Barp
- Guilherme Reis
- Guilherme Selenko
- Vinicius Trevisan
