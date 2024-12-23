import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  type Diagnostic,
  DiagnosticCategory,
  createProgram,
  flattenDiagnosticMessageText,
  getPreEmitDiagnostics,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  sys,
} from 'typescript';
import type {
  Audit,
  AuditOutput,
  AuditOutputs,
  AuditReport,
  AuditResult,
  CategoryRef,
  Issue,
  RunnerFunction,
} from '@code-pushup/models';
import { slugify } from '@code-pushup/utils';
import { audits, errorCodeToCompilerOption } from '../constants.js';
import type {
  AuditSlug,
  SupportedCompilerErrorCode,
  SupportedCompilerOptions,
  TypescriptPluginOptions,
} from '../typescript-plugin.js';

export function filterDiagnosticsByOnlyAudits(onlyAudits?: AuditSlug[]) {
  return (diag: Diagnostic) => {
    const code = diag.code as keyof typeof errorCodeToCompilerOption;
    if (errorCodeToCompilerOption[code] !== undefined) {
      if (onlyAudits && onlyAudits.length > 0) {
        const slug = slugify(errorCodeToCompilerOption[code]) as AuditSlug;
        return onlyAudits.includes(slug);
      }
      return true;
    }
    return false;
  };
}

export function filterAuditsByOnlyAudits(onlyAudits?: AuditSlug[]) {
  return (audit: Audit) => {
    if (onlyAudits && onlyAudits.length > 0) {
      return onlyAudits.includes(audit.slug as AuditSlug);
    }
    return true;
  };
}

export function createRunnerFunction(
  options: TypescriptPluginOptions,
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const { tsConfigPath = 'tsconfig.json', onlyAudits } = options;
    const configPath = resolve(process.cwd(), tsConfigPath);
    const basePath = dirname(configPath);

    try {
      await access(configPath);
    } catch {
      throw new Error(`tsconfig not found at: ${configPath}`);
    }

    const configFile = await readFile(configPath, 'utf-8');
    const { config: strictConfig } = parseConfigFileTextToJson(
      configPath,
      configFile,
    );
    const parsed = parseJsonConfigFileContent(strictConfig, sys, basePath);

    const { options: opt, fileNames } = parsed;
    if (!fileNames || fileNames.length === 0) {
      throw new Error(
        'No files matched by the TypeScript configuration. Check your "include", "exclude" or "files" settings.',
      );
    }
    const program = createProgram(fileNames, opt);
    const diagnostics = getPreEmitDiagnostics(program);

    const result: Record<
      SupportedCompilerOptions,
      Pick<AuditReport, 'slug' | 'details'>
    > = diagnostics
      .filter(({ category, code, messageText }) => {
        if (
          category === DiagnosticCategory.Warning ||
          category === DiagnosticCategory.Error
        ) {
          const compilerOptions =
            errorCodeToCompilerOption[code as SupportedCompilerErrorCode];
          if (compilerOptions !== undefined) {
            return true;
          } else {
            console.log(`Code ${code} not found. ${messageText}`);
          }
        }
        return false;
      })
      .filter(filterDiagnosticsByOnlyAudits(onlyAudits))
      .reduce(
        (acc, diag) => {
          const message = `${mapErrorToCompilerOption(diag.code)} ${flattenDiagnosticMessageText(diag.messageText, '\n')}`;
          const file = diag.file?.fileName;

          //   If undefined, the error might be global (e.g., invalid compiler option).
          if (file === undefined) {
            throw new Error(message);
          }

          const line =
            diag.file && diag.start !== undefined
              ? diag.file.getLineAndCharacterOfPosition(diag.start).line + 1
              : 0;

          const compilerOptions =
            errorCodeToCompilerOption[diag.code as SupportedCompilerErrorCode];
          const slug = slugify(compilerOptions);
          const existingIssues: Issue[] | undefined =
            acc[compilerOptions] && acc[compilerOptions].details?.issues;

          return {
            ...acc,
            [compilerOptions]: {
              slug,
              details: {
                issues: [
                  ...(existingIssues ?? []),
                  {
                    severity: getSeverity(diag.category),
                    message,
                    source: {
                      file,
                      position: {
                        startLine: line,
                      },
                    },
                  },
                ],
              },
            },
          };
        },
        {} as unknown as Record<
          SupportedCompilerOptions,
          Pick<AuditReport, 'slug' | 'details'>
        >,
      );

    console.log('ZZ', JSON.stringify(result, null, 2));
    const z = Object.values(result).map(({ slug, details }) => {
      const issues = details?.issues ?? [];
      return {
        slug,
        score: issues.length === 0 ? 1 : 0,
        value: issues.length,
        ...(issues.length ? { details } : {}),
      } satisfies AuditOutput;
    });

    return z;
  };
}

/**
 *  ts.DiagnosticCategory.Warning (1)
 *   ts.DiagnosticCategory.Error (2)
 *   ts.DiagnosticCategory.Suggestion (3)
 *   ts.DiagnosticCategory.Message (4)
 */
function getSeverity(category: DiagnosticCategory): Issue['severity'] {
  switch (category) {
    case DiagnosticCategory.Error:
      return 'error';
    case DiagnosticCategory.Warning:
      return 'warning';
    case DiagnosticCategory.Suggestion:
    case DiagnosticCategory.Message:
    default:
      return 'info';
  }
}

/**
 * https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
 * @param code
 */
function mapErrorToCompilerOption(code: number): string {
  const errorMap: Record<number, string> = {
    // Strict Mode Options
    2322: 'strictNullChecks',
    2345: 'strictFunctionTypes',
    7006: 'noImplicitAny',
    7027: 'strictPropertyInitialization',

    // Unused Code Checks
    6133: 'noUnusedParameters',
    6196: 'noUnusedLocals',

    // File Inclusion Options
    6053: 'include, files',
    6059: 'include, files',
    18002: 'include, exclude',

    // Project Settings
    5042: 'composite',
    5023: 'incremental',
    5055: 'rootDir',
    5009: 'outDir',

    // Module Resolution
    2307: 'moduleResolution',
    2820: 'baseUrl',
    2821: 'paths',

    // Compiler Options
    1375: 'esModuleInterop',
    1084: 'allowSyntheticDefaultImports',
    1323: 'downlevelIteration',
    1206: 'target',
    1371: 'resolveJsonModule',

    // New Additions from Observations
    18003: 'strict',
    7053: 'skipLibCheck',
    1372: 'isolatedModules',
    6054: 'typeRoots',
    2792: 'allowJs',
    2720: 'checkJs',
    2742: 'jsx',
    1324: 'module',
    1475: 'lib',
  };
  return errorMap[code] || 'Unknown compilerOption';
}
