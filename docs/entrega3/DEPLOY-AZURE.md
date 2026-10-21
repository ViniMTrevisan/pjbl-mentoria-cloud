# Deploy Azure — roteiro da Entrega 3

**Status: executado em 20/10/2026** na assinatura *Azure for Students* (região `centralus`),
resource group `rg-veterano-entrega3`.

| Recurso | Nome | URL |
|---|---|---|
| Shell | `swa-veterano-shell-ce3bfe` | https://proud-sky-03f0d2710.6.azurestaticapps.net |
| MFE Descoberta | `swa-veterano-descoberta-ce3bfe` | https://jolly-mushroom-0ab769910.1.azurestaticapps.net |
| MFE Agenda | `swa-veterano-agenda-ce3bfe` | https://ashy-pond-00cc75510.3.azurestaticapps.net |
| API Gateway (Kong) | `kong` (Container App) | https://kong.whiterock-0aaa2038.centralus.azurecontainerapps.io/api |
| BFF | `bff` (Container App) | https://bff.whiterock-0aaa2038.centralus.azurecontainerapps.io |
| Mentores | `mentores-service` (Container App) | https://mentores-service.whiterock-0aaa2038.centralus.azurecontainerapps.io |
| Sessões | `sessoes-service` (Container App) | https://sessoes-service.whiterock-0aaa2038.centralus.azurecontainerapps.io |
| Function | `func-veterano-ce3bfe` | https://func-veterano-ce3bfe.azurewebsites.net |
| MongoDB gerenciado | `cosmos-veterano-ce3bfe` (Mongo API 3.6, free tier) | — |
| Azure SQL | `sql-veterano-ce3bfe/pjbl_mentoria` (Basic) | — |
| Registry | `acrveteranoce3bfe.azurecr.io` (Basic) | — |

Desvios conscientes em relação ao roteiro original:

1. **Kong em Container App em vez de APIM Consumption**: o APIM exigiria e-mail de publisher e
   provisionamento lento; o Kong mantém o mesmo contrato (`/api`, CORS, rate limit) e já roda
   localmente. As políticas equivalentes de APIM seguem em `gateway/apim-policies.xml`.
2. **Serviços com ingress externo**: o ambiente Container Apps criado é do tipo *express*, que
   não resolve nome curto entre apps (`name resolution failed`). BFF e Kong consomem as URLs
   públicas dos serviços; está registrado como dívida de segurança.
3. **Cosmos DB Mongo API 3.6** em vez de Atlas M0: a conta só aceita `serverVersion 3.6`, então o
   Serviço de Mentores fixou o driver `mongodb` em 4.17 (compatível com wire version 6). O
   compose local continua com MongoDB 7 e driver novo via `npm` (o lockfile é o mesmo do build
   local; em nuvem vale a versão publicada).
4. **Azure SQL Basic** em vez de serverless: mais estável no crédito de estudante.

## Reprodução (do zero)

Pré-requisitos: Azure CLI logado (`az login`), Docker logado no ACR (`az acr login`), `swa` CLI.

```bash
RG=rg-veterano-entrega3
LOC=centralus          # brazilsouth está bloqueada na assinatura de estudante
TAG=v1
DOCKERHUB_USER=vinitrevisan
```

## 1. Imagens

```bash
DOCKERHUB_USER=$DOCKERHUB_USER IMAGE_TAG=$TAG npm run publish:dockerhub
```

## 2. Grupo de recursos e Container Apps

```bash
az group create -n $RG -l $LOC
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights

az containerapp env create -n cae-veterano -g $RG -l $LOC
```

Cada serviço é um Container App com ingress interno, exceto o BFF:

```bash
az containerapp create -n ca-mentores -g $RG --environment cae-veterano \
  --image docker.io/$DOCKERHUB_USER/veterano-mentores:$TAG \
  --target-port 4001 --ingress internal \
  --env-vars MONGODB_URI=secretref:mongodb-uri MONGODB_DB=pjbl_mentoria SEED_ON_START=false \
  --secrets mongodb-uri="$MONGODB_URI"

az containerapp create -n ca-sessoes -g $RG --environment cae-veterano \
  --image docker.io/$DOCKERHUB_USER/veterano-sessoes:$TAG \
  --target-port 4002 --ingress internal \
  --env-vars SQL_SERVER=sql-veterano.database.windows.net SQL_DATABASE=pjbl_mentoria \
    SQL_USER=veterano SQL_PASSWORD=secretref:sql-password SEED_ON_START=false \
    EVENT_SINK_URL=https://func-veterano.azurewebsites.net \
  --secrets sql-password="$SQL_PASSWORD"

az containerapp create -n ca-bff -g $RG --environment cae-veterano \
  --image docker.io/$DOCKERHUB_USER/veterano-bff:$TAG \
  --target-port 4000 --ingress external \
  --env-vars MENTORES_URL=http://ca-mentores SESSOES_URL=http://ca-sessoes \
    FUNCTION_URL=https://func-veterano.azurewebsites.net HTTP_TIMEOUT_MS=3000
```

## 3. Azure SQL

```bash
az sql server create -n sql-veterano -g $RG -l $LOC \
  -u veterano -p "$SQL_PASSWORD"
az sql db create -n pjbl_mentoria -s sql-veterano -g $RG \
  --service-objective GP_S_Gen5_1 --auto-pause-delay 60
az sql server firewall-rule create -n allow-azure -s sql-veterano -g $RG \
  --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0
```

O Serviço de Sessões cria `SESSAO` e `OUTBOX_EVENTO` no primeiro boot.

## 4. Azure Function

```bash
az storage account create -n stveterano$RANDOM -g $RG -l $LOC --sku Standard_LRS
az functionapp create -n func-veterano -g $RG --storage-account <storage> \
  --consumption-plan-location $LOC --runtime node --runtime-version 20 \
  --functions-version 4 --os-type Linux

cd azure-function && npm run build
zip -rq ../function.zip . -x "node_modules/.cache/*" -x "test/*"
cd .. && az functionapp deployment source config-zip -g $RG -n func-veterano --src function.zip
```

## 5. Microfrontends (Static Web Apps)

```bash
for app in shell mfe-descoberta mfe-agenda; do
  az staticwebapp create -n swa-$app -g $RG -l $LOC --sku Free
done

# build com as URLs públicas dos remotes e do gateway
VITE_GATEWAY_URL=https://apim-veterano.azure-api.net/api \
VITE_MFE_DESCOBERTA_URL=https://<swa-mfe-descoberta>.azurestaticapps.net/assets/remoteEntry.js \
VITE_MFE_AGENDA_URL=https://<swa-mfe-agenda>.azurestaticapps.net/assets/remoteEntry.js \
  npm --prefix microfrontend/shell run build

swa deploy microfrontend/shell/dist --deployment-token <token> --env production
```

Repita para os dois remotes, apontando `VITE_GATEWAY_URL` para o gateway.

## 6. API Gateway (Kong em Container App)

```bash
# build da imagem com gateway/kong.cloud.yml (upstream = BFF público)
az acr build -r acrveteranoce3bfe -t veterano-kong:v1 gateway

az containerapp create -n kong -g $RG --environment cae-veterano \
  --image acrveteranoce3bfe.azurecr.io/veterano-kong:v1 \
  --target-port 8000 --ingress external \
  --registry-server acrveteranoce3bfe.azurecr.io \
  --registry-username acrveteranoce3bfe --registry-password "$ACR_PASSWORD" \
  --min-replicas 1 --max-replicas 1
```

Alternativa APIM (não usada nesta execução): `az apim create --sku-name Consumption`, importar
o OpenAPI do BFF e aplicar `gateway/apim-policies.xml`. O contrato público é o mesmo:
`https://<gateway>/api/*`.

## 7. MongoDB gerenciado (Cosmos DB Mongo API)

A conta Atlas M0 não estava disponível para automação; usamos Cosmos DB com API Mongo, free
tier:

```bash
az provider register -n Microsoft.DocumentDB --wait
az cosmosdb create -n cosmos-veterano-ce3bfe -g $RG --kind MongoDB \
  --capabilities EnableMongo --enable-free-tier true \
  --locations regionName=$LOC failoverPriority=0 --default-consistency-level Session

URI=$(az cosmosdb keys list -n cosmos-veterano-ce3bfe -g $RG \
  --type connection-strings --query 'connectionStrings[0].connectionString' -o tsv)
```

A conta expõe `serverVersion 3.6` (wire version 6), por isso `mentores-service` usa
`mongodb@4.17.2`. O seed roda automaticamente no primeiro boot (`SEED_ON_START=true`) contra o
banco `pjbl_mentoria`.

Para usar Atlas em vez disso, crie o cluster M0, rode `npm --prefix mentores-service run seed`
com `MONGODB_URI` e atualize o segredo `cosmos-uri` do Container App.

## 8. Checklist do vídeo

- [x] shell público abrindo com os dois remotes
- [x] busca, solicitação, aceite, conclusão e avaliação funcionando
- [x] `/api/aggregated-data` respondendo pelo Kong
- [x] Swagger do BFF e dos dois serviços acessíveis
- [x] gateway público mostrando rate limit e CORS
- [x] reputação atualizada no card do mentor
