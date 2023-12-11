export function crawlFileSystemOptimized0<T = string>(options: {
  directory: string;
  pattern?: string | RegExp;
  fileTransform?: (filePath: string) => Promise<T> | T;
}): Promise<T[]> {
  return Promise.resolve([options] as unknown as T[]);
}
