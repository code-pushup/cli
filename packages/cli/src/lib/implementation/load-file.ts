import { bundleRequire, Options } from 'bundle-require';

// @TODO [73] move into utils
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
