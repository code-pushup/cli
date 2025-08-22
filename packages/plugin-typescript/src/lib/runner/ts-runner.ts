import {
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
} from 'typescript';
import { stringifyError } from '@code-pushup/utils';
import { loadTargetConfig } from './utils.js';

export type DiagnosticsOptions = {
  tsconfig: string;
};

export async function getTypeScriptDiagnostics({
  tsconfig,
}: DiagnosticsOptions): Promise<readonly Diagnostic[]> {
  const { fileNames, options } = loadTargetConfig(tsconfig);
  try {
    const program = createProgram(fileNames, options);
    return getPreEmitDiagnostics(program);
  } catch (error) {
    throw new Error(
      `Can't create TS program in getDiagnostics. \n ${stringifyError(error)}`,
    );
  }
}
