# Prompt.md — uso de IA generativa (IAG)

Ferramenta utilizada: **Claude Code (Anthropic)**, modelo Opus, com acesso ao **Azure MCP Server** e à Azure CLI para provisionar e publicar os recursos.

O front-end, as Azure Functions e a infraestrutura foram gerados a partir dos prompts abaixo, nesta ordem.

---

## Prompt 1 — contexto do projeto (PRD)

> Anexei o `PRD.md` do nosso PJBL: uma plataforma de mentoria entre veteranos e calouros da PUCPR
> (cadastro → descoberta → agendamento → avaliação), com modelo de dados de Usuário, AreaMentoria,
> Disponibilidade, Sessao, Avaliacao e Notificacao, e regras de negócio de reputação (média das notas,
> 1 casa decimal, mentor sem avaliação não exibe 0.0) e de busca (só mentores com pelo menos uma área,
> filtro case-insensitive, ordenado por reputação decrescente).

## Prompt 2 — o que construir

> Com base nesse PRD, construa a entrega da atividade:
>
> - Front-end em **React + Vite + TypeScript** que se comunica com **Azure Functions** servindo dados mock.
> - No mínimo **duas telas/funcionalidades** do projeto.
> - Comunicação com pelo menos **1 endpoint GET** de Azure Functions, com dados mock.
> - Arquivo `GRUPO.md` com o nome dos alunos: Bento Barp, Guilherme Reis, Guilherme Selenko, Vinicius Trevisan.
> - Arquivo `Prompt.md` informando o prompt usado para gerar o front-end.
> - `README.md` com o endereço do site publicado no Azure Static Web Apps.
> - Publicar no **Azure Static Web Apps**.
>
> O mock deve ficar dentro das próprias Azure Functions (sem Apidog), e a Function App deve ser
> um recurso separado do Static Web App, para termos as duas URLs públicas.

## Prompt 3 — direção visual do front-end

> Monte a interface como uma SPA em pt-BR, responsiva (o calouro abre no celular), com as telas:
>
> 1. **Busca de mentores** — filtros por matéria, curso e palavra-chave, chips das matérias em alta,
>    lista de cards com reputação. Consome `GET /api/mentores?curso=&materia=&q=`.
> 2. **Perfil do mentor** — bio, áreas, grade de horários livres e avaliações recebidas.
>    Consome `GET /api/mentores/{id}`.
> 3. **Minhas sessões** — próximas e histórico, com selo de status da máquina de estados do PRD
>    (SOLICITADA / ACEITA / RECUSADA / CONCLUIDA / CANCELADA). Consome `GET /api/sessoes`.
>
> Identidade visual: nada de template genérico. Trabalhe o mundo do aluno — caderno de grade e
> marca-texto: fundo de papel milimetrado, tinta azul-escura (`#16233A`), e o amarelo-limão de
> marca-texto (`#D9F24A`) usado para uma coisa só — o que está disponível ou o que importa agora.
> Tipografia: Bricolage Grotesque no display, Inter no corpo, JetBrains Mono para dados e horários.
> O elemento assinatura deve ser a **grade semanal de disponibilidade** do mentor, desenhada como
> a grade horária da faculdade, com os blocos livres pintados de marca-texto.
> Estados de carregamento, erro e vazio precisam existir e falar com o usuário, não com o sistema.

## Prompt 4 — Azure Functions (mock)

> Crie a API em Azure Functions v4 (Node, modelo de programação v4, `authLevel: anonymous`) com os
> endpoints `GET /api/mentores`, `GET /api/mentores/{id}`, `GET /api/sessoes` e `GET /api/health`.
> Os dados mock devem espelhar o modelo do PRD e aplicar as regras de negócio de reputação e de busca
> no servidor, não no front.

## Prompt 5 — publicação

> Provisione na assinatura *Azure for Students* via Azure CLI: resource group, storage account,
> Function App (Linux, consumo, Node 24, Functions v4) e Static Web App (SKU Free).
> Configure CORS na Function App liberando a URL do Static Web App, publique a API por zip deploy e
> o front-end pelo SWA CLI, e preencha o `README.md` com as URLs finais.

---

## Revisão humana

O código gerado foi revisado pelo grupo antes da publicação: conferência das regras de negócio contra
o PRD, teste manual dos endpoints e navegação nas três telas no ambiente publicado.
