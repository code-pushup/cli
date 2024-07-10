export function toUnixPath(path: string): string {
  return path.replace(/\\/g, '/');
}
