import { access, readFile } from 'node:fs/promises';
// eslint-disable-next-line unicorn/import-style
import { dirname, resolve } from 'node:path';
import {
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  sys,
} from 'typescript';

export type DiagnosticsOptions = { tsConfigPath: string };

export async function getDiagnostics(
  options: DiagnosticsOptions,
): Promise<readonly Diagnostic[]> {
  const { fileNames, options: parsedOptions } =
    await getTsConfiguration(options);

  const program = createProgram(fileNames, parsedOptions);
  return getPreEmitDiagnostics(program);
}

export async function getTsConfiguration(options: DiagnosticsOptions) {
  const { tsConfigPath = 'tsconfig.json' } = options;
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

  const { options: opt, fileNames } = parsed;
  if (fileNames.length === 0) {
    throw new Error(
      'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
    );
  }

  return {
    options: opt,
    fileNames,
  };
}
