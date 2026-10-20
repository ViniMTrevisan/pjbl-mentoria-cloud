# MFE Descoberta

Remote de Module Federation com a busca de mentores: filtros por matéria, curso e texto,
cards com reputação e disponibilidade, e drawer com grade de horários + pedido de sessão.

- Vite 5.4 + React 18.3 + TypeScript.
- Porta de dev/preview: **3001**. Expõe `./App` em `remoteEntry.js`.
- Lista vem de `GET /aggregated-data` (já enriquecida com reputação); o pedido vai por
  `POST /sessoes`. Tudo pelo gateway.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3001
npm run build      # gera dist/assets/remoteEntry.js
npm run preview    # serve o remoteEntry para o shell
```

O shell espera `http://localhost:3001/assets/remoteEntry.js` por padrão
(`VITE_MFE_DESCOBERTA_URL` no build do shell).

## Variáveis de build

| Variável | Default |
|---|---|
| `VITE_GATEWAY_URL` | `http://localhost:8080/api` |

## Integração

- Lê `veterano.usuario` do `localStorage` e envia `X-Usuario-Id` em toda chamada.
- Emite `veterano:sessoes-atualizadas` após criar uma sessão; o dashboard do shell recarrega.
- Sem biblioteca de UI: CSS próprio com os tokens do shell (navy/lima).

## Docker

```bash
docker build -t mfe-descoberta --build-arg VITE_GATEWAY_URL=http://localhost:8080/api .
```

## Integrantes

Bento Barp · Guilherme Reis · Guilherme Selenko · Vinicius Trevisan
