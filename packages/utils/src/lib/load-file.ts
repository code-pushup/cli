import { type Options, bundleRequire } from 'bundle-require';

export class NoExportError extends Error {
  constructor(filepath: string) {
    super(`No export found in ${filepath}`);
  }
}

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
  if (mod.default === undefined) {
    throw new NoExportError(options.filepath);
  }
  return parse(mod.default);
}
