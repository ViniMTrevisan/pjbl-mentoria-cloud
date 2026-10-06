# Plano - TDE 2 backend Vertical Slice

## Objetivo e abordagem

Refatorar o backend de `pjbl-mentoria-cloud` em uma branch nova, agrupando casos de uso em fatias verticais e mantendo domínio e persistência atrás de portas. Preservar rotas, status, payloads públicos e fontes de dados. Gerar documentação Markdown, diagramas em imagem e PDF com prompts e contribuições confirmadas.

Base: `main` (`bb8189a`). Branch: `tde2-vertical-slice-clean-architecture`. O repositório pai tem alterações alheias, que ficam fora do escopo; no repositório interno há um DOCX não rastreado que será preservado e excluído do commit.

## Execução

1. **[x] Arquitetura e contratos**
   - Arquivos: este plano e `docs/superpowers/specs/2026-10-05-tde2-backend-vertical-slice-design.md`.
   - Registrar fluxo, dependências, alternativas, endpoints e falhas; já concluído antes da implementação.
   - Verificação: conferir cada rota e operação contra `api/src/functions/*.js` e o contrato consumido por `frontend/src/api.ts`.

2. **[x] Refatorar o backend**
   - Mover regras puras e validações para `api/src/domain/`; criar módulos de caso de uso em `api/src/features/mentors/` e `api/src/features/sessions/`.
   - Descrever a porta em `api/src/ports/`; mover conexão Mongo e operações Mongo para `api/src/infrastructure/mongo/`; adaptar os dados mock por `api/src/infrastructure/mock/`.
   - Manter `api/src/functions/` como adaptadores HTTP finos, preservar rotas e injeção de dependências; não alterar frontend nem infraestrutura Azure.
   - Verificação focada: `node --check` em todos os arquivos JS da API; conferir imports, bindings, nomes e contratos por revisão de diff.
   - Recuperação: alterações ficam isoladas nesta branch; se a composição Azure exigir ajuste, corrigir antes da documentação e revalidar sintaxe.

3. **[x] Diagramas e documentação de prompts**
   - Criar `docs/diagramas/tde2-backend-classes.mmd` e `docs/diagramas/tde2-backend-componentes.mmd`; renderizar imagens SVG correspondentes.
   - Criar `docs/TDE2-VERTICAL-SLICE-CLEAN-ARCHITECTURE.md` e `docs/TDE2-PROMPTS.md`, ancorados nos arquivos realmente implementados.
   - Verificação: Mermaid CLI renderiza ambos; inspecionar os SVGs e conferir que as dependências seguem o código.

4. **[x] PDF de entrega**
   - Gerar `output/pdf/TDE2-Vertical-Slice-Clean-Architecture-SOLID.pdf` com identificação do projeto, contribuições confirmadas, mapa do backend, diagramas, princípios SOLID e todos os prompts usados.
   - Verificação: extrair texto, conferir páginas e renderizar para PNG com Poppler; inspecionar visualmente todas as páginas.
   - Não atribuir contribuição individual sem confirmação; aguardar a resposta do aluno antes de fechar o arquivo.

5. **[x] Revisão e publicação da branch**
   - Revisar `git diff`, verificar apenas mudanças do repo `pjbl-mentoria`, ignorar o DOCX não rastreado e não incluir alterações do repositório pai.
   - Commitar escopo exato e enviar a branch ao remoto `origin`; não abrir PR nem fazer deploy.
   - Verificação: commit `157e478` enviado; `origin/tde2-vertical-slice-clean-architecture` existe no GitHub e rastreia a branch local.
   - `git status --short --branch` confirmou que os únicos arquivos não rastreados restantes são a evidência DOCX preexistente, preservada sem stage.

## Conclusão do plano

Todos os artefatos e o código ficam na mesma branch, com o PDF também rastreado. O rollback é retornar para `main`; nenhum dado ou recurso Azure é alterado.
