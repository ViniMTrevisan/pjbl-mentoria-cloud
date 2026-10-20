# Deploy Azure — roteiro da Entrega 3

Este roteiro publica a mesma arquitetura do `docker compose` em recursos Azure. Ele **não foi
executado** nesta entrega (depende da assinatura e das credenciais do grupo); é o caminho
reproduzível para gerar as URLs públicas exigidas no vídeo.

Pré-requisitos: Azure CLI logado (`az login`), Docker logado no Docker Hub
(`docker login`), MongoDB Atlas M0 criado e `gh` autenticado.

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

Repita para os dois remotes, apontando `VITE_GATEWAY_URL` para o APIM.

## 6. API Gateway (APIM Consumption)

```bash
az apim create -n apim-veterano -g $RG -l $LOC --sku-name Consumption \
  --publisher-email aluno@pucpr.br --publisher-name Veterano
```

Importe a API do BFF pelo OpenAPI (`http://<bff>/openapi.json`), aplique
`gateway/apim-policies.xml` e configure a origem CORS para os três Static Web Apps.
Enquanto a identidade real não entra, mantenha o header `X-Usuario-Id` liberado no CORS.

## 7. MongoDB Atlas

1. Criar cluster M0 (free) na região mais próxima.
2. Criar usuário de banco e liberar acesso de rede dos Container Apps (ou `0.0.0.0/0` na demo).
3. Guardar a connection string em `MONGODB_URI` e rodar o seed:

```bash
MONGODB_URI="mongodb+srv://..." MONGODB_DB=pjbl_mentoria npm --prefix mentores-service run seed
```

## 8. Checklist do vídeo

- [ ] shell público abrindo com os dois remotes
- [ ] busca, solicitação, aceite, conclusão e avaliação funcionando
- [ ] `/api/aggregated-data` respondendo pelo APIM
- [ ] Swagger do BFF e dos dois serviços acessíveis
- [ ] Admin do APIM ou portal mostrando as políticas
- [ ] reputação atualizada no card do mentor
