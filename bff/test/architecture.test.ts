import { describe, expect, it } from 'vitest';
import 'archunit';
import { projectFiles } from 'archunit';

/**
 * Testes de arquitetura (ArchUnitTS).
 *
 * O BFF é organizado em vertical slices (`src/features/<slice>`): um slice por recurso
 * exposto ao front-end. `agregacao` tem domínio e casos de uso próprios; os demais são
 * slices finos de borda que dependem apenas das portas de `shared/application`.
 */

const SLICES = ['agregacao', 'mentores', 'sessoes', 'eventos', 'saude'];

const FRAMEWORKS = /from\s+['"](express|zod|cors|mongodb|mssql|@azure\/functions)/;

const arquivos = (pasta: RegExp) => projectFiles('tsconfig.json').inPath(pasta);

describe('arquitetura: vertical slice + clean architecture', () => {
  it('domain não depende de application, infrastructure nem presentation', async () => {
    const regra = arquivos(/^src\/features\/[^/]+\/domain\//)
      .shouldNot()
      .dependOnFiles()
      .inPath(/^src\/features\/[^/]+\/(application|infrastructure|presentation)\//);

    await expect(regra).toPassAsync();
  });

  it('application não depende de infrastructure nem de presentation', async () => {
    const regra = arquivos(/^src\/features\/[^/]+\/application\//)
      .shouldNot()
      .dependOnFiles()
      .inPath(/^src\/features\/[^/]+\/(infrastructure|presentation)\//);

    await expect(regra).toPassAsync();
  });

  it('presentation não depende de infrastructure (usa as portas da aplicação)', async () => {
    const regra = arquivos(/^src\/features\/[^/]+\/presentation\//)
      .shouldNot()
      .dependOnFiles()
      .inPath(/^src\/(features\/[^/]+\/infrastructure|shared\/infrastructure)\//);

    await expect(regra).toPassAsync({ allowEmptyTests: false });
  });

  const pares = SLICES.flatMap((origem) =>
    SLICES.filter((destino) => destino !== origem).map(
      (destino) => [origem, destino] as const,
    ),
  );

  it.each(pares)(
    'slice %s não acessa infrastructure/presentation do slice %s',
    async (origem, destino) => {
      const regra = arquivos(new RegExp(`^src/features/${origem}/`))
        .shouldNot()
        .dependOnFiles()
        .inPath(new RegExp(`^src/features/${destino}/(infrastructure|presentation)/`));

      // Um slice pode não ter as camadas mais externas (ex.: outbox só com aplicação).
      await expect(regra).toPassAsync({ allowEmptyTests: true });
    },
  );

  it('o núcleo compartilhado não conhece nenhum slice', async () => {
    const regra = arquivos(/^src\/shared\//)
      .shouldNot()
      .dependOnFiles()
      .inPath(/^src\/features\//);

    await expect(regra).toPassAsync();
  });

  it('o domínio não importa frameworks (Express, Zod, driver de banco)', async () => {
    const regra = arquivos(/^src\/features\/[^/]+\/domain\//)
      .should()
      .adhereTo(
        (arquivo) => !FRAMEWORKS.test(arquivo.content),
        'Arquivos de domínio devem ser TypeScript puro, sem frameworks',
      );

    await expect(regra).toPassAsync();
  });

  it('não existem dependências circulares em src', async () => {
    const regra = projectFiles('tsconfig.json').inPath(/^src\//).should().haveNoCycles();

    await expect(regra).toPassAsync();
  });
});
