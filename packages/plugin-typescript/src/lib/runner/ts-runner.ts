import {
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
} from 'typescript';
import { logger, pluralizeToken, stringifyError } from '@code-pushup/utils';
import { loadTargetConfig } from './utils.js';

export type DiagnosticsOptions = {
  tsconfig: string;
};

export function getTypeScriptDiagnostics({
  tsconfig,
}: DiagnosticsOptions): readonly Diagnostic[] {
  const { fileNames, options } = loadTargetConfig(tsconfig);
  try {
    const program = createProgram(fileNames, options);
    const diagnostics = getPreEmitDiagnostics(program);

    if (diagnostics.length > 0) {
      logger.info(
        `  ${tsconfig} - ${pluralizeToken('error', diagnostics.length)}`,
      );
    } else {
      logger.debug(
        `  ${tsconfig}: ${pluralizeToken('file', fileNames.length)}, 0 errors`,
      );
    }

    return diagnostics;
  } catch (error) {
    throw new Error(
      `Can't create TS program and get diagnostics.\n${stringifyError(error)}`,
    );
  }
}
