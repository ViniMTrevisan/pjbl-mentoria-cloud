# TDE 2 - desenho do backend

## Objetivo

Aplicar Vertical Slice, Clean Architecture e SOLID ao backend existente da plataforma Veterano., preservando os contratos HTTP consumidos pelo frontend e a separação atual entre catálogo mock e CRUD MongoDB.

## Abordagens avaliadas

1. **Camadas horizontais por toda a API**: controller, service e repository centralizados. É familiar e reaproveita código, mas novos casos de uso continuam espalhados entre camadas e enfraquece o requisito de Vertical Slice.
2. **Fatias por caso de uso com domínio e portas compartilhados**: cada operação tem sua regra de aplicação junto ao seu contexto; domínio puro e contratos de repositório são compartilhados, e adaptadores Azure/Mongo ficam na borda. É a escolha recomendada: satisfaz os dois padrões, mantém as rotas e limita a mudança.
3. **Reescrita DDD completa**: agregados, eventos, serviços de domínio e infraestrutura nova. Não é necessária para os endpoints do MVP e amplia custo e risco sem requisito correspondente.

**Escolha:** abordagem 2, pelo critério de menor mudança que cumpre Vertical Slice, Clean Architecture e SOLID.

## Limites e direção das dependências

- `functions/` registra bindings Azure e adapta request/response HTTP.
- `features/mentors/` e `features/sessions/` contêm um módulo por caso de uso.
- `domain/` guarda regras puras de mentor, validação e reputação.
- `ports/` descreve as operações de persistência exigidas pelos casos de uso.
- `infrastructure/` implementa as portas para MongoDB e para os dados mock.
- A borda compõe as implementações e as injeta nos casos de uso. Domínio e aplicação não importam Azure Functions nem MongoDB.

Fluxo: **Azure Function -> caso de uso da fatia -> regra de domínio/porta -> adaptador de persistência**. O caminho de resposta retorna pelo mesmo caso de uso e a Function forma o JSON/HTTP.

## Contratos preservados

- `GET /api/mentores`, `GET /api/mentores/{id}`, `GET /api/sessoes`, `GET /api/health`.
- `POST /api/mentores-db`, `GET /api/mentores-db`, `PUT|PATCH /api/mentores-db/{id}`, `DELETE /api/mentores-db/{id}`.
- Status e envelopes de sucesso/validação/not-found existentes permanecem. Erros de infraestrutura retornam mensagem genérica; o detalhe técnico não é enviado ao cliente.
- Functions seguem `authLevel: anonymous`, como no projeto existente. Esta entrega não introduz autenticação nem publicação/deploy.
- O catálogo público continua mock; o CRUD continua MongoDB, sem migrar dados ou unir as duas fontes.

## Falhas e limites

- Corpo ausente/inválido -> 400; período fora de 1–12 -> 400.
- Update sem campos -> 400; ID Mongo malformado -> 400; ID válido inexistente -> 404.
- Busca Mongo continua escapando regex e limitando a 100 documentos.
- Escrita de update usa operação atômica `$set`; falha de conexão é mapeada a 500 genérico e conexão recusada pode ser tentada novamente.
- Dados de sessão continuam em ISO 8601 e usam o relógio local do runtime para separar próximas e histórico.
- Operações concorrentes continuam com semântica de última gravação, compatível com Mongo `$set`; exclusão repetida retorna 404.

## Documentação derivada do código

Os diagramas e o PDF serão gerados depois do refactor e devem descrever somente classes, componentes e dependências implementados. Os prompts entregues registram o pedido original e os prompts técnicos gerados para esta alteração.
