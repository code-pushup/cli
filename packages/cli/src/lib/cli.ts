import { bundleRequire } from 'bundle-require';

export async function cli(configPath: string) {
  const { mod } = await bundleRequire({
    filepath: configPath,
    format: 'esm',
  });
  return mod.default || mod;
}
