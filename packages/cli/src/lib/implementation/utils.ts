import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const getDirname = (import_meta_url: string) =>
  dirname(fileURLToPath(import_meta_url));

// log error and flush stdout so that Yargs doesn't supress it
// related issue: https://github.com/yargs/yargs/issues/2118
export function logErrorBeforeThrow<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => any,
>(fn: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error(err);
      await new Promise(resolve => process.stdout.write('', resolve));
      throw err;
    }
  }) as T;
}
