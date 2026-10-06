# Prompts utilizados - TDE 2

**Ferramenta:** assistente Codex com IA generativa.
Os prompts técnicos abaixo foram redigidos para esta tarefa e orientaram a análise, a implementação e a documentação. O prompt base reproduz o pedido do aluno.

## Prompt 1 - pedido base

```text
Utilizar IA Generativa para aplicar o VERTICAL SLICE e CLEAN ARCHITECTURE e SOLID no backend da aplicação TDE 2.

Utilizar o código da aplicação que está sendo criada no TDE 2.

Em documento PDF entregar:

No arquivo deve constar o nome dos ALUNOS que auxiliou na tarefa, independente de ser atividade em grupo. (Descreva o que cada aluno realizou).

Informar o GITHUB do projeto em uma nova branch.

Informar todos os prompts utilizados para modificar a aplicação.

Entregar diagrama de classes e componentes do BACKEND da aplicação em VERTICAL SLICE e CLEAN ARCHITECTURE e SOLID (gerar em markdown e imagem).

(gere os prompts vc mesmo e faca tudo)
```

## Prompt 2 - análise e refatoração do backend (gerado)

```text
Inspecione o backend existente da plataforma Veterano. e aplique Vertical Slice, Clean Architecture e SOLID sem reescrever o produto. Preserve as rotas, métodos, formatos de sucesso e status usados pelo frontend. Mantenha o catálogo público e as sessões em dados mock, e mantenha o CRUD de mentores no MongoDB.

Deixe os handlers Azure Functions como adaptadores HTTP finos. Separe cada caso de uso em sua própria fatia, extraia regras puras de mentor para o domínio, descreva a porta de repositório e mantenha MongoDB e mock em adaptadores de infraestrutura. Monte os adaptadores na borda e injete suas dependências nas fatias.

Preserve as validações, o escape de regex, o limite de 100 registros, a atualização parcial atômica e os status 400/404 existentes. Erros internos do MongoDB devem ser registrados no servidor e não expostos ao cliente. Não mude frontend, autenticação, configuração Azure nem faça deploy.
```

## Prompt 3 - diagramas e documentação de arquitetura (gerado)

```text
Com base somente na implementação final do backend, documente as fatias verticais, as fronteiras da Clean Architecture, os princípios SOLID e o mapeamento de cada endpoint ao caso de uso e ao adaptador. Gere os diagramas Mermaid de classes/módulos e componentes em arquivos Markdown editáveis e renderize cada diagrama como SVG.

Use nomes que correspondam aos arquivos e funções do código. Mostre a direção das dependências e diferencie catálogo mock de persistência MongoDB. Se o diagrama de classes representar funções/objetos estruturais do JavaScript, deixe isso explícito.
```

## Prompt 4 - relatório e revisão da entrega (gerado)

```text
Monte um PDF acadêmico em português com objetivo, escopo, arquitetura aplicada, princípios SOLID, endpoints preservados, diagramas de classes e componentes, repositório e branch do GitHub, prompts completos e identificação dos integrantes do grupo. Marque contribuições individuais como proposta para validação quando não houver evidência no repositório; não atribua atividades como fatos sem confirmação.

Revise o código e os artefatos contra o pedido original. Confirme sintaxe, referências dos diagramas, texto extraído e renderização visual de todas as páginas. Relate separadamente o que foi validado localmente e o que não foi validado no Azure ou MongoDB.
```
