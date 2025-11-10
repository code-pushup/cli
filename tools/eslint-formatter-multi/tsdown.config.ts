import { defineConfig } from 'tsdown';
import { baseConfig, getExternalDependencies } from '../../tsdown.base';

const __dirname = import.meta.dirname;

export default defineConfig(async () => {
  const base = baseConfig({ projectRoot: __dirname });

  // Filter out README.md from copy to avoid unlink errors
  const copy = (base.copy || []).filter(
    (item: any) => !item.to?.endsWith('/README.md'),
  );

  return {
    ...base,
    external: await getExternalDependencies(__dirname),
    copy,
  };
});
