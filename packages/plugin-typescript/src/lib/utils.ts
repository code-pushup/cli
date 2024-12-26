import type { CompilerOptions } from 'typescript';
import type { Audit, Group } from '@code-pushup/models';
import { executeProcess } from '@code-pushup/utils';
import type { SemVerString } from '../../tools/generate-ts-config.js';

export function filterAuditsBySlug(slugs?: string[]) {
  return ({ slug }: Audit) => {
    if (slugs && slugs.length > 0) {
      return slugs.includes(slug);
    }
    return true;
  };
}

export function filterGroupsByAuditSlug(slugs?: string[]) {
  return ({ refs }: Group) => {
    if (slugs && slugs.length > 0) {
      return refs.some(({ slug }) => slugs.includes(slug));
    }
    return true;
  };
}

export async function getCurrentTsVersion(): Promise<SemVerString> {
  const { stdout } = await executeProcess({
    command: 'npx',
    args: ['tsc', '--version'],
  });
  return stdout.trim() as SemVerString;
}

export async function loadDefaultTsConfig(version: SemVerString) {
  try {
    const module = await import(`./${version}.ts`);
    return module.default as CompilerOptions;
  } catch (error) {
    throw new Error(
      `Could not find default TS config for version ${version}. /n ${(error as Error).message}`,
    );
  }
}
