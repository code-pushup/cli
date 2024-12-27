import {access} from 'node:fs/promises';
import {dirname} from 'node:path';
import {
  type CompilerOptions,
  type TsConfigSourceFile,
  parseJsonConfigFileContent,
  sys,
} from 'typescript';
import type {Audit, Group} from '@code-pushup/models';
import {executeProcess, kebabCaseToCamelCase} from '@code-pushup/utils';
import type {CompilerOptionName, SemVerString} from './types.js';

export function filterAuditsBySlug(slugs?: string[]) {
  return ({slug}: { slug: string }) => {
    if (slugs && slugs.length > 0) {
      return slugs.includes(slug);
    }
    return true;
  };
}

export function filterAuditsByTsOptions(compilerOptions: CompilerOptions, onlyAudits?: string[]) {
  return ({slug}: { slug: string }) => {
    const compilerOptionName = kebabCaseToCamelCase(slug) as CompilerOptionName;
    return compilerOptions[compilerOptionName] === true && filterAuditsBySlug(onlyAudits);
  };
}

export function filterGroupsByAuditSlug(slugs?: string[]) {
  return ({refs}: Group) => {
    return refs.some(filterAuditsBySlug(slugs));
  };
}

export function filterGroupsByByTsOptions(compilerOptions: CompilerOptions, onlyAudits?: string[]) {
  return ({refs}: Group) => {
    return refs.some(filterAuditsByTsOptions(compilerOptions, onlyAudits));
  };
}

export async function getCurrentTsVersion(): Promise<SemVerString> {
  const {stdout} = await executeProcess({
    command: 'npx',
    args: ['tsc', '--version'],
  });
  return stdout.split(' ').slice(-1).join('').trim() as SemVerString;
}

export async function loadDefaultTsConfig(version: SemVerString) {
  const __dirname = new URL('.', import.meta.url).pathname;
  const configPath = `${__dirname}default-ts-configs/${version}.ts`;

  try {
    await access(configPath);
  } catch {
    throw new Error(`Could not find default TS config for version ${version}.`);
  }

  try {
    const module = await import(configPath);
    return module.default;
  } catch (error) {
    throw new Error(
      `Could load default TS config for version ${version}. /n ${(error as Error).message}`,
    );
  }
}

export function mergeTsConfigs(
  ...configs: { compilerOptions: CompilerOptions }[]
): { compilerOptions: CompilerOptions } {
  return configs.reduce(
    (acc, config) => {
      return {
        ...acc,
        ...config,
        compilerOptions: {
          ...acc?.compilerOptions,
          ...config?.compilerOptions,
        },
      };
    },
    {} as { compilerOptions: CompilerOptions },
  );
}
