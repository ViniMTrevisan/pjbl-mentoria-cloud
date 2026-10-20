#!/usr/bin/env bash
# Publica todas as imagens da Entrega 3 no Docker Hub.
# Uso: DOCKERHUB_USER=seu-usuario IMAGE_TAG=v1 bash scripts/publish-dockerhub.sh
set -euo pipefail

USER="${DOCKERHUB_USER:?defina DOCKERHUB_USER}"
TAG="${IMAGE_TAG:-v1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GATEWAY_URL="${VITE_GATEWAY_URL:-http://localhost:8080/api}"

publicar() {
  local nome="$1" contexto="$2"
  shift 2
  echo "==> $USER/$nome:$TAG"
  docker build -t "$USER/$nome:$TAG" "$@" "$contexto"
  docker push "$USER/$nome:$TAG"
}

publicar veterano-bff "$ROOT/bff"
publicar veterano-mentores "$ROOT/mentores-service"
publicar veterano-sessoes "$ROOT/sessoes-service"
publicar veterano-function "$ROOT/azure-function" --platform linux/amd64
publicar veterano-mfe-descoberta "$ROOT/microfrontend/mfe-descoberta" \
  --build-arg "VITE_GATEWAY_URL=$GATEWAY_URL"
publicar veterano-mfe-agenda "$ROOT/microfrontend/mfe-agenda" \
  --build-arg "VITE_GATEWAY_URL=$GATEWAY_URL"
publicar veterano-shell "$ROOT/microfrontend/shell" \
  --build-arg "VITE_GATEWAY_URL=$GATEWAY_URL" \
  --build-arg "VITE_MFE_DESCOBERTA_URL=${VITE_MFE_DESCOBERTA_URL:-http://localhost:3001/assets/remoteEntry.js}" \
  --build-arg "VITE_MFE_AGENDA_URL=${VITE_MFE_AGENDA_URL:-http://localhost:3002/assets/remoteEntry.js}"

echo "ok: 7 imagens publicadas como $USER/veterano-*:$TAG"
