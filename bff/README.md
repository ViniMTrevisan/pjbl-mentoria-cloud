# BFF — PjBL Mentoria

Backend for Frontend (BFF) da arquitetura de microservices do projeto de mentoria entre
calouros e veteranos do curso de Engenharia de Software.

- **Stack:** Node.js 22, TypeScript strict, Express 4, CommonJS, Zod.
- **Papel:** uma única superfície HTTP para o navegador. Agrega dados de três dependências
  (Mentores em MongoDB, Sessões em Azure SQL e Azure Function de reputação) e faz proxy das
  operações de escrita.
- **Contrato:** `docs/entrega3/API-CONTRACTS.md` é a fonte de verdade de rotas e payloads.

## Por que existe

Chamar três serviços a partir do navegador custaria três round-trips, CORS triplo e lógica de
composição em cada tela. O BFF concentra isso e garante uma degradação previsível: quando um
serviço cai, a tela continua funcionando com dados parciais em vez de erro.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/aggregated-data` | Agregado da tela inicial (`?usuarioId=u1` ou header) |
| GET | `/mentores` | Proxy com filtros `curso`, `materia`, `q` |
| GET | `/mentores/:id` | Proxy de detalhe |
| POST | `/mentores` | Proxy de criação |
| PUT | `/mentores/:id` | Proxy de atualização |
| DELETE | `/mentores/:id` | Proxy de remoção |
| POST | `/mentores/:id/avaliacoes` | Proxy de avaliação |
| GET | `/sessoes` | Proxy (`?usuarioId=`, `?status=`) |
| GET | `/sessoes/:id` | Proxy de detalhe |
| POST | `/sessoes` | Proxy de solicitação |
| PATCH | `/sessoes/:id/status` | Proxy de transição (`aceitar`, `recusar`, `concluir`, `cancelar`) |
| GET | `/eventos` | Proxy do sink de eventos da Function |
| GET | `/health` | Saúde do BFF + dependências |
| GET | `/openapi.json`, `/docs` | Contrato OpenAPI e Swagger UI |

### `/aggregated-data`

Chama mentores, sessões e Function em paralelo, com **orçamento de 3000 ms por dependência**.
Reputação é calculada por mentor com no máximo 5 chamadas simultâneas à Function.

- Falha ou timeout de dependência **nunca** vira 5xx na agregação: a resposta sai `200` com
  `parcial: true` e o serviço em `falhas` (`mentores`, `sessoes`, `reputacao`).
- Mentor sem reputação calculável recebe `reputacao: null`.
- Sessões são separadas em `proximas` (futuras com status `SOLICITADA`/`ACEITA`, ordem
  ascendente) e `historico` (restante, ordem descendente).
- `resumo.mediaReputacao` é `null` quando nenhum mentor tem média.

### Identidade simulada

Sem provedor de identidade nesta entrega. Precedência: header `X-Usuario-Id` → query
`usuarioId` → `u1`. O valor é repassado aos serviços internos em toda chamada.

## Como rodar

```bash
npm install
cp .env.example .env   # opcional: os defaults já apontam para os nomes do compose
npm run dev            # tsx watch, porta 4000
```

Build de produção:

```bash
npm run build
npm start
```

## Variáveis de ambiente

| Variável | Default | Descrição |
|---|---|---|
| `PORT` | `4000` | Porta do BFF |
| `MENTORES_URL` | `http://mentores-service:4001` | Serviço de Mentores |
| `SESSOES_URL` | `http://sessoes-service:4002` | Serviço de Sessões |
| `FUNCTION_URL` | `http://azure-function:80` no compose / `http://localhost:7071` fora | Azure Function |
| `CORS_ORIGIN` | `*` | Origem(ens) permitida(s), separadas por vírgula |
| `HTTP_TIMEOUT_MS` | `3000` | Orçamento por dependência |
| `HEALTH_TIMEOUT_MS` | `1000` | Orçamento do `/health` |

## Testes

```bash
npm test        # vitest + dependency-cruiser
npm run test:watch
npm run arch    # só as regras de arquitetura
```

Casos cobertos em `test/getAggregatedData.test.ts`: caminho feliz, falha parcial do serviço de
sessões, listas vazias, timeout, Function de reputação fora, mentores fora, sink de eventos fora,
limite de concorrência e corte de data do agrupamento.

`dependency-cruiser` falha o build se `domain/` ou `application/` importarem Express ou
infraestrutura.

## Estrutura

```
src/
  domain/types.ts              DTOs do contrato, sem lógica
  application/ports/           portas de saída (Mentores, Sessões, Reputação)
  application/use-cases/       getAggregatedData (agregação e degradação)
  infrastructure/clients/      HTTP com fetch, timeout e X-Usuario-Id
  infrastructure/config.ts     env validado com Zod
  http/                        rotas, proxy, erros, OpenAPI, composição
  server.ts                    bootstrap e shutdown
```

## Docker

```bash
docker build -t pjbl-bff .
docker run --rm -p 4000:4000 -e MENTORES_URL=http://host.docker.internal:4001 pjbl-bff
```

Multi-stage `node:22-alpine`, usuário `app` não-root, apenas dependências de produção na imagem.

## Integrantes

- Bento Barp
- Guilherme Reis
- Guilherme Selenko
- Vinicius Trevisan
