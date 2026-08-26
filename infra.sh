#!/usr/bin/env bash
# Provisionamento dos recursos Azure do PJBL (idempotente).
set -euo pipefail

RG="rg-pjbl-mentoria"
LOC_FUNC="centralus"
LOC_SWA="centralus"
STORAGE="stpjblmentoria$RANDSUFFIX"
FUNCAPP="func-pjbl-mentoria-$RANDSUFFIX"
SWA="swa-pjbl-mentoria-$RANDSUFFIX"

az group create -n "$RG" -l "$LOC_FUNC" -o none
echo "resource group ok: $RG"

az storage account create -n "$STORAGE" -g "$RG" -l "$LOC_FUNC" --sku Standard_LRS -o none
echo "storage ok: $STORAGE"

az functionapp create \
  -n "$FUNCAPP" -g "$RG" \
  --storage-account "$STORAGE" \
  --consumption-plan-location "$LOC_FUNC" \
  --runtime node --runtime-version 24 --functions-version 4 \
  --os-type Linux -o none
echo "function app ok: $FUNCAPP"

az staticwebapp create -n "$SWA" -g "$RG" -l "$LOC_SWA" --sku Free -o none
echo "static web app ok: $SWA"

cat > azure-recursos.env <<EOV
RG=$RG
STORAGE=$STORAGE
FUNCAPP=$FUNCAPP
SWA=$SWA
EOV
echo "--- gravado em azure-recursos.env ---"
cat azure-recursos.env
