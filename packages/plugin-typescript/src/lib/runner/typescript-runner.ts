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
  const { tsConfigPath = 'tsconfig.json' } = options;
  const configPath = resolve(process.cwd(), tsConfigPath);
  const basePath = dirname(configPath);

  try {
    await access(configPath);
  } catch {
    throw new Error(`tsconfig not found at: ${tsConfigPath}`);
  }

  const configFile = (await readFile(configPath)).toString();

  const { config: strictConfig } = parseConfigFileTextToJson(
    configPath,
    configFile,
  );
  const parsed = parseJsonConfigFileContent(strictConfig, sys, basePath);

  const { options: opt, fileNames } = parsed;
  if (fileNames.length === 0) {
    throw new Error(
      'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
    );
  }
  const program = createProgram(fileNames, opt);
  return getPreEmitDiagnostics(program);
}
