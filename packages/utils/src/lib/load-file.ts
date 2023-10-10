import { bundleRequire, Options } from 'bundle-require';
import * as process from "process";

export async function importModule<T = unknown>(
  options: Options,
  parse?: (d: unknown) => T,
) {
  parse = parse || (v => v as T);
  options = {
    format: 'esm',
    ...options,
  };
  console.log('CWD',  process.cwd());
  const { mod } = await bundleRequire(options);
  return parse(mod.default || mod);
}
