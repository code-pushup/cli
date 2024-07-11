export function toNormalizedPath(path: string): string {
  return path.replace(/\\/g, '/');
}
