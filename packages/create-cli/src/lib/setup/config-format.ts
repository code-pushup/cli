import { select } from '@inquirer/prompts';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { PackageJson } from 'type-fest';
import { fileExists, readJsonFile } from '@code-pushup/utils';
import {
  CONFIG_FILE_FORMATS,
  type CliArgs,
  type ConfigFileFormat,
} from './types.js';

const TSCONFIG_PATTERN = /^tsconfig(\..+)?\.json$/;

type DefaultFormat = Extract<ConfigFileFormat, 'ts' | 'js'>;

/** Resolves config file format from CLI arg, auto-detection, or interactive prompt. */
export async function promptConfigFormat(
  targetDir: string,
  { 'config-format': format, yes }: CliArgs,
): Promise<ConfigFileFormat> {
  if (isConfigFileFormat(format)) {
    return format;
  }
  const defaultFormat = await detectDefaultFormat(targetDir);
  if (yes) {
    return defaultFormat;
  }
  return select<ConfigFileFormat>({
    message: 'Config file format:',
    choices: [
      { name: 'TypeScript', value: 'ts' },
      { name: 'JavaScript', value: 'js' },
    ],
    default: defaultFormat,
  });
}

/** Returns `code-pushup.config.{ts,js,mjs}` based on format and ESM context. */
export function resolveConfigFilename(
  format: ConfigFileFormat,
  isEsm: boolean,
): string {
  if (format === 'ts') {
    return 'code-pushup.config.ts';
  }
  if (format === 'js' && isEsm) {
    return 'code-pushup.config.js';
  }
  return 'code-pushup.config.mjs';
}

export async function readPackageJson(targetDir: string): Promise<PackageJson> {
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (await fileExists(packageJsonPath)) {
    return readJsonFile<PackageJson>(packageJsonPath);
  }
  return {};
}

async function detectDefaultFormat(targetDir: string): Promise<DefaultFormat> {
  const files = await readdir(targetDir);
  return files.some(file => TSCONFIG_PATTERN.test(file)) ? 'ts' : 'js';
}

function isConfigFileFormat(
  value: string | undefined,
): value is ConfigFileFormat {
  const validValues: readonly string[] = CONFIG_FILE_FORMATS;
  return value != null && validValues.includes(value);
}
