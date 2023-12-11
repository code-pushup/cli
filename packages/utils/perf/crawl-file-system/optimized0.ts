import { fastFindInFiles } from 'fast-find-in-files';
import { CrawlFileSystemOptions } from '../../src';

export function crawlFileSystemOptimized0<T = string>(
  options: CrawlFileSystemOptions<T>,
): Promise<T[]> {
  const { directory, pattern: needle = '@TODO' } = options;
  return fastFindInFiles({ directory, needle }) as unknown as Promise<T[]>;
}
