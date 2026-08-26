# Veterano. — Plataforma de Mentoria entre Veteranos e Calouros

PJBL da disciplina **Arquitetura e Soluções em Cloud** — PUCPR.

Front-end em React + Vite (TypeScript) publicado no **Azure Static Web Apps**, consumindo uma API
mock hospedada em **Azure Functions**.

## Endereços publicados

| O quê | Endereço |
|---|---|
| **Site (Azure Static Web Apps)** | https://white-rock-03ee36c10.7.azurestaticapps.net |
| **API (Azure Functions)** | https://func-pjbl-mentoria.azurewebsites.net |
| **Repositório** | https://github.com/ViniMTrevisan/pjbl-mentoria-cloud |

> **Mock:** o Apidog **não** foi utilizado. Os dados mock ficam dentro das próprias Azure Functions,
> em [`api/src/data/mock.js`](api/src/data/mock.js), e as regras de negócio (reputação e filtros de
> busca) são aplicadas no servidor.

## Grupo

Bento Barp · Guilherme Reis · Guilherme Selenko · Vinicius Trevisan — ver [GRUPO.md](GRUPO.md).

Prompts de IA generativa usados na geração do front-end: [Prompt.md](Prompt.md).

---

## Endpoints da API (Azure Functions)

Todos são `GET`, `authLevel: anonymous`, e devolvem JSON.

| Endpoint | RF do PRD | O que faz |
|---|---|---|
| [`GET /api/mentores`](https://func-pjbl-mentoria.azurewebsites.net/api/mentores) | RF5 | Lista mentores. Aceita `?curso=`, `?materia=` e `?q=` (case-insensitive). Só retorna mentores com ao menos uma área cadastrada, ordenados por reputação decrescente. |
| [`GET /api/mentores/{id}`](https://func-pjbl-mentoria.azurewebsites.net/api/mentores/u1) | RF5, RF11 | Perfil público do mentor: bio, áreas, disponibilidade, avaliações e reputação. |
| [`GET /api/sessoes`](https://func-pjbl-mentoria.azurewebsites.net/api/sessoes) | RF9 | Sessões do usuário, separadas em `proximas` e `historico`. Aceita `?status=`. |
| [`GET /api/health`](https://func-pjbl-mentoria.azurewebsites.net/api/health) | — | Verificação de disponibilidade da Function App. |

Exemplo:

```bash
curl "https://func-pjbl-mentoria.azurewebsites.net/api/mentores?materia=cloud"
```

## Telas implementadas

| Tela | Rota | Endpoint consumido |
|---|---|---|
| **Busca de mentores** — filtros por matéria, curso e palavra-chave, chips de matérias em alta, lista ordenada por reputação | `/` | `GET /api/mentores` |
| **Perfil do mentor** — bio, áreas, grade semanal de horários livres e avaliações recebidas | `/mentores/:id` | `GET /api/mentores/{id}` |
| **Minhas sessões** — próximas e histórico, com selo de status da máquina de estados do PRD | `/sessoes` | `GET /api/sessoes` |

## Arquitetura

```
Navegador
   │
   ├── HTTPS ──► Azure Static Web Apps (SKU Free, centralus)
   │             └── build estático do Vite (dist/)
   │
   └── HTTPS ──► Azure Functions (Flex Consumption, Node 22, centralus)
                 └── dados mock em memória (api/src/data/mock.js)
```

O front-end e a API são recursos **separados**. O CORS da Function App libera apenas a origem do
Static Web App e `http://localhost:5173` (desenvolvimento).

Recursos na assinatura *Azure for Students*, resource group `rg-pjbl-mentoria` (região `centralus`,
única região permitida pela policy da assinatura entre as que suportam os dois serviços):

| Recurso | Nome |
|---|---|
| Static Web App | `swa-pjbl-mentoria-7205` |
| Function App | `func-pjbl-mentoria` |
| Storage Account | `stpjblmentoria7205` |

---

## Rodando localmente

Pré-requisitos: Node 22+, Azure Functions Core Tools v4 e Azure CLI.

```bash
# API
cd api && npm install && npm start        # http://localhost:7071
```

```bash
# Front-end
cd frontend && npm install && npm run dev  # http://localhost:5173
```

Sem `VITE_API_BASE_URL` definida, o front-end aponta para `http://localhost:7071`. Para apontar
para a API publicada, copie `frontend/.env.example` para `frontend/.env.local`.

## Publicando

```bash
./infra.sh   # provisiona resource group, storage, Function App e Static Web App
```

```bash
cd api && zip -rq ../api.zip . -x local.settings.json && cd .. && az functionapp deployment source config-zip -g rg-pjbl-mentoria -n func-pjbl-mentoria --src api.zip
```

```bash
cd frontend && npm run build && swa deploy ./dist --deployment-token "$(az staticwebapp secrets list -g rg-pjbl-mentoria -n swa-pjbl-mentoria-7205 --query properties.apiKey -o tsv)" --env production
```

---

## Testes manuais

| # | Caminho | Passos | Esperado |
|---|---|---|---|
| 1 | Feliz — busca | Abrir `/`, clicar no chip **Banco de Dados** | Lista filtra para João Vitor Salles |
| 2 | Feliz — reputação | Abrir `/` | Fernanda (5.0) aparece antes de Mariana (4.3); ordenação decrescente |
| 3 | Borda — sem avaliações | Observar o card de João Vitor Salles | Exibe "Sem avaliações ainda", **não** 0.0 (regra RF11) |
| 4 | Feliz — perfil | Clicar em Ana Beatriz Moraes | Grade semanal marca segunda 14–16h e quarta 19–21h |
| 5 | Erro — mentor inexistente | `GET /api/mentores/u999` | HTTP 404 com `{"erro":"Mentor nao encontrado"}`; a tela mostra "Perfil indisponível." |
| 6 | Feliz — sessões | Abrir `/sessoes` | 2 sessões em "Próximas" e 4 em "Histórico", com selos por status |
| 7 | Vazio — busca sem resultado | Digitar `xyz` em Matéria | "Nenhum mentor para esses filtros." |
| 8 | Erro — API fora do ar | Parar a Function App e recarregar `/` | "Não foi possível carregar os mentores." em vez de tela em branco |

## Escopo

Esta entrega cobre o recorte pedido na atividade: front-end + Azure Functions com dados mock.
Autenticação, banco de dados, agendamento com escrita e notificações por e-mail estão descritos no
`PRD.md` do projeto semestral e ficam fora deste recorte.
