/** Regras de arquitetura: domínio e aplicação não conhecem Express nem infraestrutura. */
module.exports = {
  forbidden: [
    {
      name: 'domain-puro',
      severity: 'error',
      comment:
        'A camada de domínio não pode importar Express, HTTP, infraestrutura ou clients.',
      from: { path: '^src/domain' },
      to: { path: '^(src/http|src/infrastructure)|^express$|^cors$|^swagger-ui-express$' },
    },
    {
      name: 'application-pura',
      severity: 'error',
      comment:
        'Casos de uso dependem apenas de portas e domínio; nunca de adaptadores.',
      from: { path: '^src/application' },
      to: { path: '^(src/http|src/infrastructure)|^express$|^cors$|^swagger-ui-express$' },
    },
    {
      name: 'sem-ciclo',
      severity: 'error',
      comment: 'Dependências circulares são proibidas.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'sem-orfao',
      severity: 'warn',
      comment: 'Módulo sem ninguém importando pode indicar código morto.',
      from: { orphan: true, pathNot: ['^src/server\\.ts$'] },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: 'node_modules|dist' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
