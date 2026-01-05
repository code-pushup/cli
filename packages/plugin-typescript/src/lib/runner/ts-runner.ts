import {
  type Diagnostic,
  createProgram,
  getPreEmitDiagnostics,
} from 'typescript';
import {
  logger,
  pluralizeToken,
  profiler,
  stringifyError,
} from '@code-pushup/utils';
import { loadTargetConfig } from './utils.js';

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
    const diagnostics = profiler.measure(
      'plugin-typescript:typescript-program-exec',
      () => {
        const program = createProgram(fileNames, options);
        return getPreEmitDiagnostics(program);
      },
      {
        ...profiler.measureConfig.tracks.pluginTypescript,
        color: 'tertiary-dark',
        success: (tsDiagnostics: readonly Diagnostic[]) => ({
          properties: [
            ['Files', String(fileNames.length)],
            ['Diagnostics', String(tsDiagnostics.length)],
          ],
          tooltipText: `TypeScript program executed on ${fileNames.length} files, found ${tsDiagnostics.length} diagnostics`,
        }),
      },
    );
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
