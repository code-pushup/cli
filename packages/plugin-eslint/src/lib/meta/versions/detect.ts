import { ESLint } from 'eslint';
import { fileExists } from '@code-pushup/utils';
import type { ConfigFormat } from './formats.js';

// relevant ESLint docs:
// - https://eslint.org/docs/latest/use/configure/configuration-files
// - https://eslint.org/docs/latest/use/configure/configuration-files-deprecated
// - https://eslint.org/docs/v8.x/use/configure/configuration-files-new

export async function detectConfigVersion(): Promise<ConfigFormat> {
  if (process.env['ESLINT_USE_FLAT_CONFIG'] === 'true') {
    return 'flat';
  }
  if (process.env['ESLINT_USE_FLAT_CONFIG'] === 'false') {
    return 'legacy';
  }
  if (ESLint.version.startsWith('8.')) {
    if (await fileExists('eslint.config.js')) {
      return 'flat';
    }
    return 'legacy';
  }
  return 'flat';
}
