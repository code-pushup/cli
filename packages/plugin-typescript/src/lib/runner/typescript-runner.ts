import { access, readFile } from 'node:fs/promises';
// eslint-disable-next-line unicorn/import-style
import { dirname, resolve } from 'node:path';
import {
  type CompilerOptions,
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  sys,
} from 'typescript';
import type { TypescriptPluginOptions } from '../types.js';
import { loadTargetConfig } from '../utils.js';

export type DiagnosticsOptions = {
  fileNames: string[];
  compilerOptions: CompilerOptions;
};

export async function getDiagnostics(
  tsConfigPath: string,
): Promise<readonly Diagnostic[]> {
  try {
    const { fileNames, options } = await loadTargetConfig(tsConfigPath);
    const program = createProgram(fileNames, options);
    return getPreEmitDiagnostics(program);
  } catch (error) {
    throw new Error(
      `Can't create TS program in getDiagnostics. \n ${(error as Error).message}`,
    );
  }
}

export async function getTsConfigurationFromPath(
  options: Pick<TypescriptPluginOptions, 'tsConfigPath'>,
): Promise<DiagnosticsOptions> {
  const { tsConfigPath } = options;
  const configPath = resolve(process.cwd(), tsConfigPath);
  const basePath = dirname(configPath);

  try {
    await access(configPath);
  } catch {
    throw new Error(`tsconfig not found at: ${tsConfigPath}`);
  }

  const configFile = (await readFile(configPath)).toString();

  const { config } = parseConfigFileTextToJson(configPath, configFile);
  const parsed = parseJsonConfigFileContent(config, sys, basePath);

  const { options: compilerOptions, fileNames } = parsed;
  if (fileNames.length === 0) {
    throw new Error(
      'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
    );
  }

  return {
    compilerOptions,
    fileNames,
  };
}
