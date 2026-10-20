# Contratos entre componentes — Entrega 3

Fonte de verdade para os serviços, BFF e microfrontends da arquitetura de microservices.
Todas as datas trafegam em ISO-8601 UTC (`2026-10-20T18:00:00.000Z`); a UI formata em
`America/Sao_Paulo`.

## Topologia e portas

| Componente | Porta local | URL pública no compose |
|---|---|---|
| API Gateway (Kong) | 8080 | `http://localhost:8080` |
| Kong Admin API | 8001 | `http://localhost:8001` |
| BFF | 4000 | `http://localhost:4000` |
| Serviço de Mentores (MongoDB) | 4001 | `http://localhost:4001` |
| Serviço de Sessões (Azure SQL) | 4002 | `http://localhost:4002` |
| Azure Function | 7071 | `http://localhost:7071` |
| Shell (microfrontend) | 3000 | `http://localhost:3000` |
| MFE Descoberta | 3001 | `http://localhost:3001` |
| MFE Agenda | 3002 | `http://localhost:3002` |
| MongoDB | 27017 | — |
| SQL Server 2022 | 1433 | — |

O navegador **só** conhece o gateway (`VITE_GATEWAY_URL=http://localhost:8080/api`) e os
remotes do microfrontend. Nenhuma tela chama serviço interno direto.

## Identidade simulada

Sem provedor de identidade nesta entrega. O shell guarda o usuário selecionado em
`localStorage` (`veterano.usuario`) e envia o header `X-Usuario-Id`.

| Usuário | Papel | Nome |
|---|---|---|
| `u1` | mentorado (calouro) | Bruno Calouro |
| `u2` | mentor (veterano) | Ana Beatriz Moraes |
| `u3` | mentor | João Vitor Salles |
| `u4` | mentor | Mariana Lopes |
| `u5` | mentor | Fernanda Lima |

Os documentos de mentor usam o mesmo identificador do usuário (`u2`…`u5`), o que permite ao
shell alternar entre “visão do calouro” e “visão do mentor” sem tabela de vínculo.

## Modelo — Mentor (MongoDB `pjbl_mentoria.mentores`)

```json
{
  "id": "u2",
  "nome": "Ana Beatriz Moraes",
  "email": "ana.moraes@pucpr.br",
  "curso": "Engenharia de Software",
  "periodo": 7,
  "bio": "Monitora de Estrutura de Dados e Cloud.",
  "ehMentor": true,
  "ehMentorado": false,
  "areas": [
    { "id": "a1", "curso": "Engenharia de Software", "materia": "Estrutura de Dados" }
  ],
  "disponibilidades": [
    { "id": "d1", "diaSemana": 1, "horaInicio": "14:00", "horaFim": "16:00" }
  ],
  "avaliacoes": [
    { "id": "av1", "sessaoId": "s1", "nota": 5, "comentario": "Ótima!", "criadaEm": "2026-10-01T18:00:00.000Z" }
  ],
  "criadoEm": "2026-08-01T12:00:00.000Z",
  "atualizadoEm": "2026-10-01T18:00:00.000Z"
}
```

`diaSemana`: 0 = domingo … 6 = sábado. `nota`: inteiro 1..5. `sessaoId` é único dentro do
array de avaliações do mentor.

### Endpoints — Serviço de Mentores (`:4001`)

| Método | Rota | Corpo / query | Resposta |
|---|---|---|---|
| GET | `/mentores` | `?curso=&materia=&q=` | `200 {total, itens: MentorResumo[]}` |
| GET | `/mentores/:id` | — | `200 Mentor` / `404 {erro}` |
| POST | `/mentores` | `{nome,email,curso?,periodo?,bio?,areas?,disponibilidades?}` | `201 Mentor` / `422 {erro,campos}` |
| PUT | `/mentores/:id` | campos parciais | `200 Mentor` / `404` / `422` |
| DELETE | `/mentores/:id` | — | `204` / `404` |
| POST | `/mentores/:id/avaliacoes` | `{sessaoId, nota, comentario?}` | `201 Avaliacao` / `409` duplicada / `422` nota inválida |
| GET | `/health` | — | `200 {status:"ok",servico:"mentores"}` |
| GET | `/openapi.json` | — | OpenAPI 3 |
| GET | `/docs` | — | Swagger UI |

`MentorResumo`: `{id, nome, curso, periodo, bio, areas, disponibilidades, notas,
totalAvaliacoes}`. `notas` é `number[]` (apenas as notas) para o cálculo de reputação em lote
pela Function.

Busca: só mentores com `ehMentor=true` e ao menos uma área; filtros case-insensitive por
`curso`/`materia`; `q` procura em nome, bio e matéria.

### Endpoints — Serviço de Sessões (`:4002`, Azure SQL)

| Método | Rota | Corpo / query | Resposta |
|---|---|---|---|
| GET | `/sessoes` | `?usuarioId=&status=` | `200 {total, itens: Sessao[]}` |
| GET | `/sessoes/:id` | — | `200 Sessao` / `404` |
| POST | `/sessoes` | `{mentorId, mentoradoId, mentorNome, mentoradoNome, dataHora, assunto}` | `201 Sessao` / `422` |
| PATCH | `/sessoes/:id/status` | `{acao, atorId}` (`aceitar\|recusar\|concluir\|cancelar`) | `200 Sessao` / `403` / `404` / `409` |
| GET | `/health` | — | `200 {status:"ok",servico:"sessoes"}` |
| GET | `/openapi.json` | — | OpenAPI 3 |
| GET | `/docs` | — | Swagger UI |

`Sessao`:

```json
{
  "id": "s1",
  "mentorId": "u2",
  "mentoradoId": "u1",
  "mentorNome": "Ana Beatriz Moraes",
  "mentoradoNome": "Bruno Calouro",
  "dataHora": "2026-10-22T17:00:00.000Z",
  "assunto": "Dúvida em árvores binárias",
  "status": "SOLICITADA",
  "criadaEm": "2026-10-20T12:00:00.000Z",
  "atualizadaEm": "2026-10-20T12:00:00.000Z"
}
```

`status` ∈ `SOLICITADA | ACEITA | RECUSADA | CONCLUIDA | CANCELADA`.

Máquina de estados: `aceitar`/`recusar` só de `SOLICITADA` e somente o mentor; `cancelar` de
`SOLICITADA` ou `ACEITA` por qualquer participante; `concluir` só de `ACEITA` por qualquer
participante. Transição inválida → `409`; ator que não participa → `403`; não mentor tentando
aceitar/recusar → `403`.

### Endpoints — Azure Function (`:7071`)

| Método | Rota | Corpo / query | Resposta |
|---|---|---|---|
| POST | `/api/reputacao` | `{notas?: number[], avaliacoes?: [{nota}]}` | `200 {total, media, distribuicao, selo, semAvaliacoes}` |
| GET | `/api/eventos` | `?limite=50` | `200 {total, itens: Evento[]}` |
| POST | `/api/eventos` | `Evento` (CloudEvents-like) | `202 {recebido:true}` |
| GET | `/api/health` | — | `200 {status:"ok",servico:"function-reputacao"}` |

`media`: número com 1 casa decimal ou `null` se não houver notas; `semAvaliacoes`: boolean;
`distribuicao`: `{"1":0,"2":1,"3":2,"4":4,"5":7}`; `selo`: `"novo" | "confiavel" | "excelente"`
(`excelente` média ≥ 4.5 e ≥ 3 notas; `confiavel` média ≥ 3.5).

Evento aceito pelo `POST /api/eventos`: `{id, type, source, time, data}`; a Function mantém os
últimos 100 em memória para demonstração do fluxo EDA (o alvo em nuvem é Service Bus).

### BFF (`:4000`)

| Método | Rota | Observação |
|---|---|---|
| GET | `/aggregated-data` | **Obrigatório.** `?usuarioId=u1` |
| GET | `/mentores` | proxy com filtros |
| GET | `/mentores/:id` | proxy |
| POST | `/mentores` | proxy |
| PUT | `/mentores/:id` | proxy |
| DELETE | `/mentores/:id` | proxy |
| POST | `/mentores/:id/avaliacoes` | proxy |
| GET | `/sessoes` | proxy (`?usuarioId=`) |
| POST | `/sessoes` | proxy |
| PATCH | `/sessoes/:id/status` | proxy |
| GET | `/eventos` | proxy da Function |
| GET | `/health` | `{status, dependencias:{mentores,sessoes,function}}` |
| GET | `/openapi.json`, `/docs` | Swagger |

Resposta de `/aggregated-data`:

```json
{
  "geradoEm": "2026-10-20T18:00:00.000Z",
  "usuarioId": "u1",
  "mentores": [{ "...MentorResumo": true, "reputacao": { "media": 4.8, "total": 5, "selo": "excelente", "semAvaliacoes": false } }],
  "sessoes": { "proximas": [], "historico": [], "total": 3 },
  "resumo": { "totalMentores": 4, "totalSessoes": 3, "sessoesPendentes": 1, "mediaReputacao": 4.6 },
  "eventos": [],
  "parcial": false,
  "falhas": []
}
```

Se um serviço falhar ou estourar 3000 ms, o BFF devolve o que conseguiu, marca
`parcial: true` e lista o nome do serviço em `falhas`. Nunca responde 5xx por falha de
dependência na agregação.

### Gateway (Kong `:8080`)

Rotas públicas: `/api/*` → BFF (strip `/api`). Plugins: CORS, `rate-limiting` (120 req/min
por IP), `request-transformer` adicionando `X-Gateway: kong`. Admin API em `:8001`.

## Eventos de domínio (outbox → sink)

| Evento | Produtor | Consumidor local | Payload |
|---|---|---|---|
| `SessaoSolicitada` | Sessões | Function `/api/eventos` | `sessaoId, mentorId, mentoradoId, dataHora` |
| `SessaoAceita` / `SessaoRecusada` / `SessaoCancelada` | Sessões | idem | `sessaoId, ator, statusAnterior` |
| `SessaoConcluida` | Sessões | idem | `sessaoId, mentorId, mentoradoId` |
| `MentorAtualizado` | Mentores | idem (opcional) | `mentorId, camposAlterados` |

O relay do outbox roda no Serviço de Sessões a cada 2 s, publica em `EVENT_SINK_URL` e marca
`publicadoEm`. Falha de publicação mantém a linha pendente para nova tentativa (pelo menos uma
vez).
