# API Gateway — Kong 3.7 (DB-less)

Porta de entrada única do navegador. Em nuvem o papel é do **Azure API Management
(Consumption)**; localmente usamos Kong pela aderência ao mesmo modelo (rotas, plugins,
configuração declarativa versionada) e por rodar em Docker sem banco.

## O que está configurado

`kong.yml`:

- serviço `bff` → `http://bff:4000`
- rota `/api` com `strip_path`, então `GET /api/aggregated-data` chega ao BFF como
  `GET /aggregated-data`
- plugins: `cors`, `rate-limiting` (120 req/min por IP, 3000/h) e `request-transformer`
  adicionando `X-Gateway: kong`

| URL | O que é |
|---|---|
| http://localhost:8080/api/aggregated-data | rota pública |
| http://localhost:8001/status | Admin API (health do nó) |
| http://localhost:8001/services | configuração aplicada |

## Verificar

```bash
curl -i http://localhost:8080/api/health
curl -s http://localhost:8001/services | jq '.data[].name'
for i in $(seq 1 130); do curl -s -o /dev/null http://localhost:8080/api/health; done
# a partir da 121ª chamada no mesmo minuto: 429
```

## Alvo Azure

As políticas equivalentes em APIM ficam em `apim-policies.xml` (esboço):

- `validate-jwt` contra o JWKS do Entra External ID;
- `rate-limit-by-key` por usuário;
- `cors` restrito às origens dos Static Web Apps;
- `set-header X-Usuario-Id` a partir do claim `sub`.

O BFF não muda: o gateway continua entregando `X-Usuario-Id` e o caminho sem `/api`.
