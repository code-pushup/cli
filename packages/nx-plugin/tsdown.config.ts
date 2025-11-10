import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig } from 'tsdown';
import { baseConfig, getExternalDependencies } from '../../tsdown.base';

const __dirname = import.meta.dirname;

export default defineConfig(async () => {
  const base = baseConfig({ projectRoot: __dirname });

  // Remove generators.json and executors.json from copy array
  // We'll handle them in onSuccess to update the .cjs references
  const copyWithoutJsonFiles = ((base as any).copy || []).filter(
    (item: any) =>
      !item.to.endsWith('/generators.json') &&
      !item.to.endsWith('/executors.json'),
  );

  return {
    ...base,
    format: ['cjs'], // NX supports only commonjs
    external: await getExternalDependencies(__dirname),
    copy: copyWithoutJsonFiles,
    async onSuccess() {
      // Call base onSuccess first
      const baseOnSuccess = (base as any).onSuccess;
      if (typeof baseOnSuccess === 'function') {
        await baseOnSuccess();
      }

      // Copy and update generators.json
      const generatorsJsonPath = join(__dirname, 'dist', 'generators.json');
      await copyFile(join(__dirname, 'generators.json'), generatorsJsonPath);

      const generatorsJson = JSON.parse(
        await readFile(generatorsJsonPath, 'utf8'),
      );

      for (const generator of Object.values(generatorsJson.generators)) {
        const gen = generator as { factory: string };
        if (gen.factory && !gen.factory.endsWith('.cjs')) {
          gen.factory = gen.factory.replace(/\.js$/, '') + '.cjs';
        }
      }

      await writeFile(
        generatorsJsonPath,
        JSON.stringify(generatorsJson, null, 2) + '\n',
        'utf8',
      );

      // Copy and update executors.json
      const executorsJsonPath = join(__dirname, 'dist', 'executors.json');
      await copyFile(join(__dirname, 'executors.json'), executorsJsonPath);

      const executorsJson = JSON.parse(
        await readFile(executorsJsonPath, 'utf8'),
      );

      for (const executor of Object.values(executorsJson.executors)) {
        const exec = executor as { implementation: string };
        if (exec.implementation && !exec.implementation.endsWith('.cjs')) {
          exec.implementation =
            exec.implementation.replace(/\.js$/, '') + '.cjs';
        }
      }

      await writeFile(
        executorsJsonPath,
        JSON.stringify(executorsJson, null, 2) + '\n',
        'utf8',
      );
    },
  };
});
