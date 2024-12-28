import {
  type CompilerOptions,
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
} from 'typescript';
import { loadTargetConfig, validateDiagnostics } from './utils.js';

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
