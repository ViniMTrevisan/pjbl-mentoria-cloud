# Shell — Veterano

Host de Module Federation do portal de mentoria. Renderiza o layout (sidebar, topbar,
seletor de usuário), o dashboard agregado e carrega os remotes de **Descoberta** e **Agenda**.

- Vite 5.4 + React 18.3 + TypeScript + `@originjs/vite-plugin-federation` 1.3.6.
- Porta de dev/preview: **3000**.
- Consome `GET /aggregated-data` do BFF via gateway.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # helpers puros (formato, status, separação de sessões)
npm run build
npm run preview
```

Para carregar os remotes em desenvolvimento, suba `mfe-descoberta` (3001) e `mfe-agenda`
(3002) com `npm run build && npm run preview` — o `remoteEntry.js` é servido pelo preview.

## Variáveis de build

| Variável | Default |
|---|---|
| `VITE_GATEWAY_URL` | `http://localhost:8080/api` |
| `VITE_MFE_DESCOBERTA_URL` | `http://localhost:3001/assets/remoteEntry.js` |
| `VITE_MFE_AGENDA_URL` | `http://localhost:3002/assets/remoteEntry.js` |

```bash
VITE_MFE_DESCOBERTA_URL=https://mfe-descoberta.example/assets/remoteEntry.js npm run build
```

## Resiliência

Cada remote é carregado com `React.lazy` dentro de um `ErrorBoundary`. Se o remote estiver
fora do ar, a rota mostra "módulo indisponível" e o restante do shell continua navegável.
Identidade simulada em `localStorage` (`veterano.usuario`) e header `X-Usuario-Id`.

## Docker

```bash
docker build -t mfe-shell \
  --build-arg VITE_GATEWAY_URL=http://localhost:8080/api \
  --build-arg VITE_MFE_DESCOBERTA_URL=http://localhost:3001/assets/remoteEntry.js \
  --build-arg VITE_MFE_AGENDA_URL=http://localhost:3002/assets/remoteEntry.js .
```

## Integrantes

Bento Barp · Guilherme Reis · Guilherme Selenko · Vinicius Trevisan
