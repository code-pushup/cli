import {
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
} from 'typescript';
import { loadTargetConfig, validateDiagnostics } from './utils.js';

export type DiagnosticsOptions = {
  tsConfigPath: string;
};

export async function getTypeScriptDiagnostics({
  tsConfigPath,
}: DiagnosticsOptions): Promise<readonly Diagnostic[]> {
  try {
    const { fileNames, options } = await loadTargetConfig(tsConfigPath);

    const program = createProgram(fileNames, options);
    // @TODO use more fine-grained helpers like getSemanticDiagnostics instead of getPreEmitDiagnostics
    const diagnostics = getPreEmitDiagnostics(program);
    validateDiagnostics(diagnostics);

    return diagnostics;
  } catch (error) {
    throw new Error(
      `Can't create TS program in getDiagnostics. \n ${(error as Error).message}`,
    );
  }
}
