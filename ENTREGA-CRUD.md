# Entrega — 4 Azure Functions + MongoDB Atlas

**Disciplina:** Arquitetura e Soluções em Cloud — PUCPR
**Projeto:** Veterano. — Plataforma de Mentoria entre Veteranos e Calouros (PJBL)

## Alunos que realizaram a atividade

| Aluno |
|---|
| Bento Barp |
| Guilherme Reis |
| Guilherme Selenko |
| Vinicius Trevisan |

## Endereços

| O quê | Endereço |
|---|---|
| Front-end (Azure Static Web Apps) | https://white-rock-03ee36c10.7.azurestaticapps.net |
| Tela de CRUD | https://white-rock-03ee36c10.7.azurestaticapps.net/cadastro |
| API (Azure Functions) | https://func-pjbl-mentoria.azurewebsites.net |
| Banco (MongoDB Atlas) | `Cluster-PUCPR` → banco `pjbl_mentoria` → coleção `mentores` |

---

## 1. Evidência — criação do banco de dados MongoDB

Cluster **Cluster-PUCPR** no MongoDB Atlas. Banco `pjbl_mentoria`, coleção `mentores`,
populada pelo script [`seed-mongo.js`](seed-mongo.js).

Saída completa em [`docs/evidencias/01-mongodb.txt`](docs/evidencias/01-mongodb.txt):

```
banco: pjbl_mentoria
colecoes: mentores
documentos em mentores: 5
indices: ["_id_","nome_1"]
--- amostra ---
{ _id: ObjectId('6a95fb7e901adccb95d968a6'),
  nome: 'Ana Beatriz Moraes',
  curso: 'Engenharia de Software',
  periodo: 7,
  areas: [ { materia: 'Estrutura de Dados' },
           { materia: 'Arquitetura e Soluções em Cloud' } ] }
```

Comando reproduzível:

```bash
mongosh "$MONGODB_URI/pjbl_mentoria" --eval 'db.mentores.countDocuments()'
```

Para a captura de tela: MongoDB Atlas → **Browse Collections** → banco `pjbl_mentoria` → coleção `mentores`.

---

## 2. Evidência — criação das 4 Azure Functions

Function App **`func-pjbl-mentoria`** (Linux, Node, Functions v4), resource group
`rg-pjbl-mentoria`. As 4 Functions do CRUD são registros `app.http` **separados** — uma
Function por operação, cada uma no seu arquivo:

| # | Azure Function | Arquivo | Verbo | Rota | Operação |
|---|---|---|---|---|---|
| 1 | `mentoresInserir` | [`api/src/functions/mentoresInserir.js`](api/src/functions/mentoresInserir.js) | `POST` | `/api/mentores-db` | **Inserir** |
| 2 | `mentoresPesquisar` | [`api/src/functions/mentoresPesquisar.js`](api/src/functions/mentoresPesquisar.js) | `GET` | `/api/mentores-db?q=` | **Pesquisar** |
| 3 | `mentoresAlterar` | [`api/src/functions/mentoresAlterar.js`](api/src/functions/mentoresAlterar.js) | `PUT` | `/api/mentores-db/{id}` | **Alterar** |
| 4 | `mentoresExcluir` | [`api/src/functions/mentoresExcluir.js`](api/src/functions/mentoresExcluir.js) | `DELETE` | `/api/mentores-db/{id}` | **Excluir** |

Conexão com o Atlas em [`api/src/db.js`](api/src/db.js): client cacheado em escopo de módulo
(o processo da Function é reaproveitado entre invocações — abrir um pool por request esgotaria
as conexões do cluster). A connection string vive no App Setting `MONGODB_URI`, **não** no
repositório.

Listagem das Functions publicadas — [`docs/evidencias/02-functions.txt`](docs/evidencias/02-functions.txt):

```
Funcao                                Rota              Metodos     Auth
------------------------------------  ----------------  ----------  ---------
func-pjbl-mentoria/mentoresAlterar    mentores-db/{id}  PUT, PATCH  anonymous
func-pjbl-mentoria/mentoresExcluir    mentores-db/{id}  DELETE      anonymous
func-pjbl-mentoria/mentoresInserir    mentores-db       POST        anonymous
func-pjbl-mentoria/mentoresPesquisar  mentores-db       GET         anonymous
```

Comando reproduzível:

```bash
az functionapp function list -g rg-pjbl-mentoria -n func-pjbl-mentoria -o table
```

Para a captura de tela: portal Azure → Function App `func-pjbl-mentoria` → **Functions** — as quatro aparecem na lista.

---

## 3. Evidência — front-end executando as 4 Azure Functions

Tela **Cadastro** ([`frontend/src/pages/Cadastro.tsx`](frontend/src/pages/Cadastro.tsx)),
publicada em https://white-rock-03ee36c10.7.azurestaticapps.net/cadastro.

Cada ação da tela dispara uma Function diferente, através de
[`frontend/src/api.ts`](frontend/src/api.ts):

| Ação na tela | Chamada do front | Azure Function |
|---|---|---|
| Digitar na busca | `pesquisarMentores(q)` | `mentoresPesquisar` |
| Botão **inserir (POST)** | `inserirMentor(dados)` | `mentoresInserir` |
| Botão **salvar alteração (PUT)** | `alterarMentor(id, dados)` | `mentoresAlterar` |
| Botão **excluir** | `excluirMentor(id)` | `mentoresExcluir` |

O painel **"Chamadas às Functions"** na lateral da tela registra, a cada ação, o nome da
Function, o verbo HTTP, a rota e o status da resposta — é a evidência visual de que as quatro
estão sendo executadas pelo front-end.

Registro de uma sessão real de teste feita pela interface — inserir, pesquisar, alterar e excluir,
em [`docs/evidencias/04-frontend-log.txt`](docs/evidencias/04-frontend-log.txt):

```
mentoresExcluir     DELETE /api/mentores-db/6a95fe705ceb9caa8792f5a3   200 · Bento Barp
mentoresAlterar     PUT    /api/mentores-db/6a95fe705ceb9caa8792f5a3   200 · Bento Barp
mentoresInserir     POST   /api/mentores-db                            201 · id 6a95fe705ceb9caa8792f5a3
mentoresPesquisar   GET    /api/mentores-db                            200 · 5 registro(s)
```

Para a captura de tela: abrir `/cadastro`, cadastrar um mentor, alterá-lo e excluí-lo — o painel
lateral acumula as quatro chamadas, como acima.

Verificação equivalente por linha de comando, direto contra as Functions publicadas:
[`docs/evidencias/03-crud-live.txt`](docs/evidencias/03-crud-live.txt) — inclui os casos de erro
(`400` para dados inválidos e id malformado, `404` para registro inexistente).

---

## Configuração do Atlas

O plano de consumo das Azure Functions usa IPs de saída dinâmicos, então o cluster precisa
liberar o acesso em **Network Access**. Sem isso o Atlas rejeita a conexão ainda no handshake
TLS e as Functions respondem `500`.

## Reproduzindo

```bash
# 1. popular o banco
MONGODB_URI="mongodb+srv://<user>:<senha>@<cluster>.mongodb.net/" node seed-mongo.js

# 2. configurar a Function App
az functionapp config appsettings set -g rg-pjbl-mentoria -n func-pjbl-mentoria \
  --settings MONGODB_URI="mongodb+srv://..." MONGODB_DB="pjbl_mentoria"

# 3. publicar a API
cd api && zip -rq ../api.zip . -x local.settings.json && cd .. && \
  az functionapp deployment source config-zip -g rg-pjbl-mentoria -n func-pjbl-mentoria --src api.zip

# 4. publicar o front-end
cd frontend && npm run build && swa deploy ./dist \
  --deployment-token "$(az staticwebapp secrets list -g rg-pjbl-mentoria -n swa-pjbl-mentoria-7205 --query properties.apiKey -o tsv)" \
  --env production
```
