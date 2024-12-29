import { access } from 'node:fs/promises';
// eslint-disable-next-line unicorn/import-style
import { dirname, join } from 'node:path';
import {
  type CompilerOptions,
  type Diagnostic,
  DiagnosticCategory,
  type ParsedCommandLine,
  flattenDiagnosticMessageText,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  sys,
} from 'typescript';
import type { Issue } from '@code-pushup/models';
import {
  executeProcess,
  readTextFile,
  truncateIssueMessage,
} from '@code-pushup/utils';
import { TS_CONFIG_DIR } from '../constants.js';
import { AUDIT_LOOKUP } from './constants.js';
import type { CompilerOptionName, SemVerString } from './types.js';

/**
 * Transform the TypeScript error code to the audit slug.
 * @param code - The TypeScript error code.
 * @returns The audit slug.
 * @throws Error if the code is not supported.
 */
export function tSCodeToAuditSlug(code: number): CompilerOptionName {
  const knownCode = AUDIT_LOOKUP.get(code);
  if (knownCode === undefined) {
    throw new Error(`Code ${code} not supported.`);
  }
  return knownCode;
}

/**
 * Get the severity of the issue based on the TypeScript diagnostic category.
 * - ts.DiagnosticCategory.Warning (1)
 * - ts.DiagnosticCategory.Error (2)
 * - ts.DiagnosticCategory.Suggestion (3)
 * - ts.DiagnosticCategory.Message (4)
 * @param category - The TypeScript diagnostic category.
 * @returns The severity of the issue.
 */
export function getSeverity(category: DiagnosticCategory): Issue['severity'] {
  switch (category) {
    case DiagnosticCategory.Error:
      return 'error';
    case DiagnosticCategory.Warning:
      return 'warning';
    default:
      return 'info';
  }
}

/**
 * Get the issue from the TypeScript diagnostic.
 * @param diag - The TypeScript diagnostic.
 * @returns The issue.
 * @throws Error if the diagnostic is global (e.g., invalid compiler option).
 */
export function getIssueFromDiagnostic(diag: Diagnostic) {
  const message = `${flattenDiagnosticMessageText(diag.messageText, '\n')}`;

  // If undefined, the error might be global (e.g., invalid compiler option).
  if (diag.file === undefined) {
    throw new Error(
      `Error with code ${diag.code} has no file given. Message: ${message}`,
    );
  }

  const startLine =
    diag.start === undefined
      ? undefined
      : diag.file.getLineAndCharacterOfPosition(diag.start).line + 1;

  return {
    severity: getSeverity(diag.category),
    message: truncateIssueMessage(message),
    source: {
      file: diag.file.fileName,
      ...(startLine
        ? {
            position: {
              startLine,
            },
          }
        : {}),
    },
  } satisfies Issue;
}

const _TS_CONFIG_MAP = new Map<string, ParsedCommandLine>();

export async function loadTargetConfig(tsConfigPath: string) {
  if (_TS_CONFIG_MAP.has(tsConfigPath)) {
    return _TS_CONFIG_MAP.get(tsConfigPath) as ParsedCommandLine;
  }

  const { config } = parseConfigFileTextToJson(
    tsConfigPath,
    await readTextFile(tsConfigPath),
  );

  const parsedConfig = parseJsonConfigFileContent(
    config,
    sys,
    dirname(tsConfigPath),
  );

  if (parsedConfig.fileNames.length === 0) {
    throw new Error(
      'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
    );
  }

  _TS_CONFIG_MAP.set(tsConfigPath, parsedConfig);
  return _TS_CONFIG_MAP.get(tsConfigPath) as ParsedCommandLine;
}

export async function getCurrentTsVersion(): Promise<SemVerString> {
  const { stdout } = await executeProcess({
    command: 'npx',
    args: ['-y', 'tsc', '--version'],
  });
  return stdout.split(' ').slice(-1).join('').trim() as SemVerString;
}

export async function loadTsConfigDefaultsByVersion() {
  const version = await getCurrentTsVersion();
  const configPath = join(
    process.cwd(),
    'node_modules',
    TS_CONFIG_DIR,
    `${version}.js`,
  );
  try {
    await access(configPath);
  } catch {
    throw new Error(
      `Could not find default TS config for version ${version} at ${configPath}. The plugin maintainer has to support this version.`,
    );
  }

  try {
    const module = await import(configPath);
    return module.default as { compilerOptions: CompilerOptions };
  } catch (error) {
    throw new Error(
      `Could load default TS config for version ${version} at ${configPath}. The plugin maintainer has to support this version. \n ${(error as Error).message}`,
    );
  }
}

export function validateDiagnostics(diagnostics: readonly Diagnostic[]) {
  diagnostics
    .filter(({ code }) => !AUDIT_LOOKUP.has(code))
    .forEach(({ code, messageText }) => {
      console.warn(
        `Diagnostic Warning: The code ${code} is not supported. ${messageText}`,
      );
    });
}
