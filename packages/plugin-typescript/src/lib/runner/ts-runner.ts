import {
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
} from 'typescript';
import { loadTargetConfig } from './utils.js';

export type DiagnosticsOptions = {
  tsconfig: string;
};

export async function getTypeScriptDiagnostics({
  tsconfig,
}: DiagnosticsOptions): Promise<readonly Diagnostic[]> {
  const { fileNames, options } = await loadTargetConfig(tsconfig);
  try {
    const program = createProgram(fileNames, options);
    // @TODO use more fine-grained helpers like getSemanticDiagnostics instead of getPreEmitDiagnostics
    return getPreEmitDiagnostics(program);
  } catch (error) {
    throw new Error(
      `Can't create TS program in getDiagnostics. \n ${(error as Error).message}`,
    );
  }
}
