import { type Entry, walkStream } from '@nodelib/fs.walk';
import type { CrawlFileSystemOptions } from '../../src';

// from https://github.com/webpro/knip/pull/426
export function crawlFileSystemFsWalk<T = string>(
  options: CrawlFileSystemOptions<T>,
): Promise<T[]> {
  const { directory } = options;

  return new Promise((resolve, reject) => {
    const result: T[] = [];
    const stream = walkStream(directory);

    stream.on('data', (entry: Entry) => {
      // eslint-disable-next-line functional/immutable-data
      result.push(entry.path as T);
    });

    stream.on('error', error => {
      reject(error);
    });

    stream.on('end', () => {
      resolve(result);
    });
  });
}
