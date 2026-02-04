import { type Options, bundleRequire } from 'bundle-require';
import { stat } from 'node:fs/promises';
import { settlePromise } from './promises.js';

export async function importModule<T = unknown>(options: Options): Promise<T> {
  const resolvedStats = await settlePromise(stat(options.filepath));
  if (resolvedStats.status === 'rejected') {
    throw new Error(`File '${options.filepath}' does not exist`);
  }
  if (!resolvedStats.value.isFile()) {
    throw new Error(`Expected '${options.filepath}' to be a file`);
  }

  const { mod } = await bundleRequire<object>({
    format: 'esm',
    ...options,
  });

  if (typeof mod === 'object' && 'default' in mod) {
    return mod.default as T;
  }
  return mod as T;
}
