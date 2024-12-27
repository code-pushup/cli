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

export type DiagnosticsOptions = {
  fileNames: string[];
  compilerOptions: CompilerOptions;
};

export async function getDiagnostics({
  fileNames,
  compilerOptions,
}: DiagnosticsOptions): Promise<readonly Diagnostic[]> {
  const program = createProgram(fileNames, compilerOptions);
  return getPreEmitDiagnostics(program);
}

export async function getTsConfigurationFromPath(
  options: Pick<TypescriptPluginOptions, 'tsConfigPath'> & {
    existingConfig: CompilerOptions;
  },
): Promise<DiagnosticsOptions> {
  const { tsConfigPath, existingConfig } = options;
  const configPath = resolve(process.cwd(), tsConfigPath);
  const basePath = dirname(configPath);

  try {
    await access(configPath);
  } catch {
    throw new Error(`tsconfig not found at: ${tsConfigPath}`);
  }

  const configFile = (await readFile(configPath)).toString();

  const { config } = parseConfigFileTextToJson(configPath, configFile);
  const parsed = parseJsonConfigFileContent(
    config,
    sys,
    basePath,
    existingConfig,
  );

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
