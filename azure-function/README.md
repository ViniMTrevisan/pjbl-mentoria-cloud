# Azure Function — reputação e sink de eventos

Azure Function (Node v4 programming model, HTTP trigger) que tira do banco o cálculo de
reputação do mentor e serve de destino local para os eventos de domínio do Serviço de Sessões.

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/reputacao` | `{notas:[5,4,4]}` ou `{avaliacoes:[{nota:5}]}` → `{total, media, distribuicao, selo, semAvaliacoes}` |
| GET | `/api/eventos?limite=50` | últimos eventos recebidos (buffer em memória, 100 no máximo) |
| POST | `/api/eventos` | recebe um evento CloudEvents-like; idempotente por `id` |
| GET | `/api/health` | healthcheck |

Regras: média aritmética arredondada em 1 casa; sem notas → `media: null` e
`semAvaliacoes: true`; nota fora de 1..5 ou fracionária → 422. Selo: `excelente` (média ≥ 4.5
e ≥ 3 notas), `confiavel` (média ≥ 3.5), `novo` caso contrário.

## Estrutura

```
src/
├── domain/reputacao.ts        regra pura, sem dependência de Azure
├── infrastructure/eventStore.ts  buffer idempotente de eventos
└── functions/index.ts         triggers HTTP e tradução para resposta
test/reputacao.test.ts
```

## Rodar localmente

Com Docker (já integrado ao compose da raiz):

```bash
docker compose up --build azure-function
curl http://localhost:7071/api/health
curl -X POST http://localhost:7071/api/reputacao \
  -H 'content-type: application/json' -d '{"notas":[5,4,4]}'
```

Sem Docker, é preciso o Azure Functions Core Tools v4:

```bash
npm install && npm run build && npm start   # :7071
npm test                                    # 9 testes de domínio
```

## Configuração

| Variável | Uso |
|---|---|
| `AzureWebJobsStorage` | obrigatória pelo host; no compose aponta para o Azurite |
| `FUNCTIONS_WORKER_RUNTIME` | `node` |

## Alunos

Bento Barp · Guilherme Reis · Guilherme Selenko · Vinicius Trevisan
