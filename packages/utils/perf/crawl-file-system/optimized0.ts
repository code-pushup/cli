import { CrawlFileSystemOptions } from '../../src';

export function crawlFileSystemOptimized0<T = string>(
  options: CrawlFileSystemOptions<T>,
): Promise<T[]> {
  const { directory, pattern: needle = '@TODO' } = options;
  return Promise.resolve([directory, needle] as T[]);
}
