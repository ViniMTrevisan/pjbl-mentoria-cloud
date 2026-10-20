/** Regras de fronteira da Clean Architecture + Vertical Slice. */
module.exports = {
  forbidden: [
    {
      name: 'domain-isolado',
      severity: 'error',
      comment: 'domain nao pode importar nada fora de domain.',
      from: { path: '^src/domain' },
      to: { pathNot: '^src/domain' },
    },
    {
      name: 'ports-sem-infra',
      severity: 'error',
      comment: 'ports so podem depender de domain.',
      from: { path: '^src/ports' },
      to: { pathNot: '^src/(ports|domain)' },
    },
    {
      name: 'features-sem-infra',
      severity: 'error',
      comment: 'features nao conhecem infrastructure, http nem drivers.',
      from: { path: '^src/features' },
      to: {
        path: '^src/(infrastructure|http)|node_modules/(express|mongodb|mssql)',
      },
    },
    {
      name: 'infra-sem-http',
      severity: 'error',
      comment: 'infrastructure nao pode depender de http.',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/http' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
