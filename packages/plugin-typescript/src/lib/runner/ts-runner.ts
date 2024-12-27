import {
  type CompilerOptions,
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
} from 'typescript';
import { AUDIT_LOOKUP } from './constants.js';
import { loadTargetConfig } from './utils.js';

export type DiagnosticsOptions = {
  fileNames: string[];
  compilerOptions: CompilerOptions;
};

export async function getTypeScriptDiagnostics(
  tsConfigPath: string,
): Promise<readonly Diagnostic[]> {
  try {
    const { fileNames, options } = await loadTargetConfig(tsConfigPath);
    const program = createProgram(fileNames, options);

    const diagnostics = getPreEmitDiagnostics(program);
    validateDiagnostics(diagnostics);

    return diagnostics;
  } catch (error) {
    throw new Error(
      `Can't create TS program in getDiagnostics. \n ${(error as Error).message}`,
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
