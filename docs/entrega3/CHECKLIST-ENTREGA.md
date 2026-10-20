# Checklist da Entrega 3

Conferência item a item contra o enunciado do PJBL.

## Arquitetura

| Item exigido | Como foi entregue | Evidência |
|---|---|---|
| Microfrontend (SPA que só consome BFF) | shell + MFE Descoberta + MFE Agenda com Module Federation | `microfrontend/`, print 01–03 |
| BFF Node.js com `GET /aggregated-data` | Express + TS, agrega mentores + sessões + Function | `bff/`, Swagger, `scripts/smoke.sh` |
| Microserviço 1 com MongoDB | Serviço de Mentores, CRUD + Swagger | `mentores-service/` |
| Microserviço 2 com Azure SQL | Serviço de Sessões, CRUD + Swagger + outbox | `sessoes-service/` |
| Azure Function HTTP Trigger | reputação e sink de eventos | `azure-function/` |
| API Gateway | Kong local (APIM no alvo) | `gateway/kong.yml`, print 07 |
| Dockerização + Docker Hub | 7 Dockerfiles + script de publicação | `scripts/publish-dockerhub.sh` |
| Clean Architecture | domain/ports/features/infrastructure/http | testes `test:arch` |
| Vertical Slice | uma fatia por caso de uso | `features/*.ts` |
| Testes unitários | Vitest em domínio e casos de uso | `npm run test:all` |
| Testes de arquitetura | dependency-cruiser | `test:arch` em cada serviço |
| README por projeto | README em cada pasta + raiz | `*/README.md` |

## Documentação

| Item exigido | Onde está |
|---|---|
| ARC42 completo | `docs/entrega3/ARC42.md` + PDF `Arquitetura-Veterano-Entrega3.pdf` |
| Links GitHub | Anexo A do ARC42 |
| Links Docker Hub | Anexo A e seção 7.2 |
| Swagger BFF | http://localhost:4000/docs |
| Swagger microservices | http://localhost:4001/docs e :4002/docs |
| Eventos | seção 8.1 + `diagramas/eventos.mmd` |
| Frontend | `microfrontend/` + prints 01–03 |
| API Gateway | `gateway/` + print 07 |
| Vídeo YouTube | campo reservado no Anexo A (gravar após deploy) |
| C4 contexto | `diagramas/c4-n1-contexto.mmd` |
| C4 containers | `diagramas/c4-n2-conteineres.mmd` |
| C4 componentes | `c4-n3-bff`, `c4-n3-mentores`, `c4-n3-sessoes`, `c4-n3-mfe` |
| Canvas | seção 4.3 do ARC42 |
| Prints Swagger | `prints/04` a `06` |
| Print frontend | `prints/01` a `03b` |
| Print API Gateway | `prints/07-gateway-e-function.png` |
| Print Function | incluído em `prints/07-gateway-e-function.png` |

## Pendências que dependem de credenciais do grupo

| Pendência | Comando / onde |
|---|---|
| Push das imagens | `DOCKERHUB_USER=... npm run publish:dockerhub` |
| Deploy Azure (URLs públicas do vídeo) | `docs/entrega3/DEPLOY-AZURE.md` |
| Gravação do vídeo e link no ARC42 | Anexo A, substituir `SUBSTITUIR-PELO-ID-DO-VIDEO` |
| Repositórios separados (opcional) | o monorepo mantém um diretório por projeto; separar em 5 repos é apenas `git subtree split` |

## Comandos de verificação

```bash
npm run test:all      # unitários + arquitetura
npm run up            # docker compose up --build -d
npm run smoke         # fluxo completo pelo gateway
npm run publish:dockerhub
```
