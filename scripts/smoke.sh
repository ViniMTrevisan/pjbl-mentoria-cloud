#!/usr/bin/env bash
# Smoke test da arquitetura completa através do API Gateway.
# Requer: docker compose up --build -d && curl && python3
set -euo pipefail

GW="${GATEWAY_URL:-http://localhost:8080/api}"
BFF="${BFF_URL:-http://localhost:4000}"
FUNCTION="${FUNCTION_URL:-http://localhost:7071}"
falhas=0

checar() {
  local nome="$1" url="$2" esperado="${3:-200}"
  local status
  status="$(curl -sL -o /dev/null -w '%{http_code}' "$url")"
  if [ "$status" = "$esperado" ]; then
    echo "ok   $nome ($status)"
  else
    echo "FALHA $nome (esperado $esperado, veio $status)" >&2
    falhas=$((falhas + 1))
  fi
}

json() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"
}

echo "== saúde =="
checar "gateway → bff /health" "$GW/health"
checar "swagger do BFF" "$BFF/docs"
checar "function /health" "$FUNCTION/api/health"

echo "== agregação =="
agregado="$(curl -s "$GW/aggregated-data?usuarioId=u1")"
parcial="$(printf '%s' "$agregado" | json "d['parcial']")"
mentores="$(printf '%s' "$agregado" | json "len(d['mentores'])")"
sessoes="$(printf '%s' "$agregado" | json "d['resumo']['totalSessoes']")"
echo "     parcial=$parcial mentores=$mentores sessoes=$sessoes"
[ "$mentores" -ge 3 ] || { echo "FALHA esperava >= 3 mentores" >&2; falhas=$((falhas + 1)); }
[ "$parcial" = "False" ] || { echo "FALHA agregação parcial com tudo no ar" >&2; falhas=$((falhas + 1)); }

echo "== fluxo de sessão =="
criada="$(curl -s -X POST "$GW/sessoes" -H 'content-type: application/json' -H 'X-Usuario-Id: u1' -d '{
  "mentorId":"u2","mentoradoId":"u1","mentorNome":"Ana Beatriz Moraes","mentoradoNome":"Bruno Calouro",
  "dataHora":"2030-01-10T18:00:00.000Z","assunto":"Smoke test da arquitetura"
}')"
sessao="$(printf '%s' "$criada" | json "d['id']")"
echo "     sessão criada: $sessao"

status_aceite="$(curl -s -o /tmp/smoke-aceite.json -w '%{http_code}' -X PATCH "$GW/sessoes/$sessao/status" \
  -H 'content-type: application/json' -H 'X-Usuario-Id: u2' -d '{"acao":"aceitar","atorId":"u2"}')"
[ "$status_aceite" = "200" ] && echo "ok   aceite pelo mentor (200)" || { echo "FALHA aceite ($status_aceite)" >&2; falhas=$((falhas + 1)); }

status_errado="$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$GW/sessoes/$sessao/status" \
  -H 'content-type: application/json' -H 'X-Usuario-Id: u3' -d '{"acao":"concluir","atorId":"u3"}')"
[ "$status_errado" = "403" ] && echo "ok   ator errado recebe 403" || { echo "FALHA esperava 403, veio $status_errado" >&2; falhas=$((falhas + 1)); }

echo "== reputação =="
media="$(curl -s -X POST "$FUNCTION/api/reputacao" -H 'content-type: application/json' -d '{"notas":[5,4,4]}' | json "d['media']")"
[ "$media" = "4.3" ] && echo "ok   function calcula média 4.3" || { echo "FALHA média=$media" >&2; falhas=$((falhas + 1)); }

sleep 4
echo "== eventos =="
eventos="$(curl -s "$GW/eventos" | json "d['total']")"
echo "     eventos recebidos pelo sink: $eventos"

if [ "$falhas" -ne 0 ]; then
  echo "== $falhas verificação(ões) falharam ==" >&2
  exit 1
fi
echo "== smoke ok =="
