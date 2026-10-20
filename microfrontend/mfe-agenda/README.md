# MFE Agenda

Remote de Module Federation com a agenda de sessões: abas Próximas/Histórico, badges de
status, ações por papel (mentor aceita/recusa, ambos cancelam e concluem, mentorado avalia)
e modal de avaliação 1..5.

- Vite 5.4 + React 18.3 + TypeScript.
- Porta de dev/preview: **3002**. Expõe `./App` em `remoteEntry.js`.
- Consome `GET /sessoes?usuarioId=`, `PATCH /sessoes/:id/status` e
  `POST /mentores/:id/avaliacoes`, sempre pelo gateway.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3002
npm run build
npm run preview    # serve o remoteEntry para o shell
```

## Variáveis de build

| Variável | Default |
|---|---|
| `VITE_GATEWAY_URL` | `http://localhost:8080/api` |

## Regras de ação

| Status | Mentor | Mentorado |
|---|---|---|
| `SOLICITADA` | aceitar, recusar, cancelar | cancelar |
| `ACEITA` | concluir, cancelar | concluir, cancelar |
| `CONCLUIDA` | — | avaliar (se ainda não avaliou) |

- Cancelar e recusar pedem confirmação em dois toques.
- Avaliações enviadas ficam em `localStorage` (`veterano.avaliacoes`); um `409` do servidor
  também marca a sessão como avaliada.
- Toda ação dispara `veterano:sessoes-atualizadas`, que faz o dashboard do shell recarregar.

## Docker

```bash
docker build -t mfe-agenda --build-arg VITE_GATEWAY_URL=http://localhost:8080/api .
```

## Integrantes

Bento Barp · Guilherme Reis · Guilherme Selenko · Vinicius Trevisan
