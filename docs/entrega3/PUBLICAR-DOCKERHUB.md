# Publicar as imagens no Docker Hub — passo a passo

As 7 imagens já são construídas localmente pelo `docker compose`. Para publicá-las no Docker
Hub e deixar o compose consumindo o registry, siga os passos abaixo.

## 1. Criar a conta e o repositório

1. Acesse https://hub.docker.com e crie a conta (ou use a existente).
2. Confirme o e-mail (o Docker Hub bloqueia push sem e-mail confirmado).
3. Não é necessário criar repositório manualmente: o primeiro `docker push` cria
   `veterano-bff`, `veterano-mentores`, `veterano-sessoes`, `veterano-function`,
   `veterano-shell`, `veterano-mfe-descoberta` e `veterano-mfe-agenda`.
4. Deixe os repositórios **públicos** (Settings → Visibility → Public), como pede a entrega.

## 2. Login

```bash
docker login -u SEU_USUARIO
# senha: use um Personal Access Token (Account Settings → Security → New Access Token,
# escopo Read & Write), não a senha da conta
```

## 3. Publicar

Na raiz do repositório:

```bash
cd ~/Documents/pucpr/arq-cloud/pjbl-mentoria
DOCKERHUB_USER=SEU_USUARIO IMAGE_TAG=v1 bash scripts/publish-dockerhub.sh
```

O script:

1. builda `veterano-bff`, `veterano-mentores`, `veterano-sessoes` e `veterano-function`
   (`--platform linux/amd64`, necessário para Azure);
2. builda os três microfrontends com `VITE_GATEWAY_URL` apontando para o gateway;
3. faz `docker push` de cada tag `:v1`.

Para apontar o front para o gateway da Azure:

```bash
DOCKERHUB_USER=SEU_USUARIO \
VITE_GATEWAY_URL=https://kong.whiterock-0aaa2038.centralus.azurecontainerapps.io/api \
VITE_MFE_DESCOBERTA_URL=https://jolly-mushroom-0ab769910.1.azurestaticapps.net/assets/remoteEntry.js \
VITE_MFE_AGENDA_URL=https://ashy-pond-00cc75510.3.azurestaticapps.net/assets/remoteEntry.js \
bash scripts/publish-dockerhub.sh
```

## 4. Verificar

```bash
docker manifest inspect SEU_USUARIO/veterano-bff:v1 | head
curl -s https://hub.docker.com/v2/repositories/SEU_USUARIO/veterano-bff/tags | head
```

Ou abra `https://hub.docker.com/r/SEU_USUARIO/veterano-bff`.

## 5. Usar as imagens publicadas

Edite `docker-compose.yml` trocando o bloco `build:` por `image:`:

```yaml
  bff:
    image: SEU_USUARIO/veterano-bff:v1
```

Repita para `mentores-service`, `sessoes-service`, `azure-function`, `shell`,
`mfe-descoberta` e `mfe-agenda`, depois:

```bash
docker compose pull
docker compose up -d
```

## 6. Atualizar a Azure (opcional)

Os Container Apps hoje usam o ACR `acrveteranoce3bfe`. Para trocar pelo Docker Hub:

```bash
az containerapp update -n mentores-service -g rg-veterano-entrega3 \
  --image SEU_USUARIO/veterano-mentores:v1 \
  --registry-server docker.io --registry-username SEU_USUARIO \
  --registry-password "$DOCKERHUB_TOKEN"
```

Repita para `sessoes-service`, `bff` e `kong`. O `kong` publicado no Docker Hub usa
`gateway/kong.cloud.yml`, que aponta para o BFF público.

## Observações

- `veterano-function` é `linux/amd64`; em Mac Apple Silicon o build usa emulação
  (`--platform linux/amd64`), por isso demora mais.
- Tags imutáveis (`v2`, `v3`…) evitam cache antigo em Container Apps.
- O `.env.example` já tem `DOCKERHUB_USER` e `IMAGE_TAG`; nunca comite o token.
