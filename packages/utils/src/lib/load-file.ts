import { Options, bundleRequire } from 'bundle-require';

export async function importEsmModule<T = unknown>(
  options: Options,
  parse?: (d: unknown) => T,
) {
  parse = parse || (v => v as T);
  options = {
    format: 'esm',
    ...options,
  };

  const { mod } = await bundleRequire(options);
  // @TODO consider handling undefined exports
  return parse(mod.default || mod);
}
