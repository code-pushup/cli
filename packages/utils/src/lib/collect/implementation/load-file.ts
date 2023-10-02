import { bundleRequire, Options } from 'bundle-require';

export async function importModule<T = unknown>(
  options: Options,
  parse?: (d: unknown) => T,
) {
  parse = parse || (v => v as T);
  options = {
    format: 'esm',
    ...options,
  };
  const { mod } = await bundleRequire(options);
  return parse(mod.default || mod);
}
