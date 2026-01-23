import {
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
} from 'typescript';
import {
  loadTargetConfig,
  logger,
  pluralizeToken,
  stringifyError,
} from '@code-pushup/utils';

export type DiagnosticsOptions = {
  tsconfig: string;
};

export function getTypeScriptDiagnostics({
  tsconfig,
}: DiagnosticsOptions): readonly Diagnostic[] {
  const { fileNames, options } = loadTargetConfig(tsconfig);
  logger.info(
    `Parsed TypeScript config file ${tsconfig}, program includes ${pluralizeToken('file', fileNames.length)}`,
  );
  try {
    const program = createProgram(fileNames, options);
    const diagnostics = getPreEmitDiagnostics(program);
    logger.info(
      `TypeScript compiler found ${pluralizeToken('diagnostic', diagnostics.length)}`,
    );
    return diagnostics;
  } catch (error) {
    throw new Error(
      `Can't create TS program and get diagnostics.\n${stringifyError(error)}`,
    );
  }
}
