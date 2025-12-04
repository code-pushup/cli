import { createRequire } from 'node:module';

export function getVersion(): string {
  const packageJson = createRequire(import.meta.url)(
    '../../../package.json',
  ) as typeof import('../../../package.json');
  return packageJson.version;
}
