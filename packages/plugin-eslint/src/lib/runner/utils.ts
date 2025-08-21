import type { ESLint } from 'eslint';
import { glob } from 'glob';
import type { PluginArtifactOptions } from '@code-pushup/models';
import {
  executeProcess,
  pluralizeToken,
  readJsonFile,
  ui,
} from '@code-pushup/utils';
import type { LinterOutput } from './types.js';

async function resolveGlobPatterns(patterns: string[]): Promise<string[]> {
  const resolvedPathArrays = await Promise.all(
    patterns.map(async pattern => glob(pattern)),
  );

  const resolvedPaths = resolvedPathArrays.flat();

  return [...new Set(resolvedPaths)].sort();
}

export async function loadArtifacts(
  artifacts: PluginArtifactOptions,
): Promise<LinterOutput[]> {
  if (artifacts.generateArtifactsCommand) {
    const { command, args = [] } =
      typeof artifacts.generateArtifactsCommand === 'string'
        ? { command: artifacts.generateArtifactsCommand }
        : artifacts.generateArtifactsCommand;

    // Log the actual command that was executed
    const commandString =
      typeof artifacts.generateArtifactsCommand === 'string'
        ? artifacts.generateArtifactsCommand
        : `${command} ${args.join(' ')}`;
    await ui().logger.log(`$ ${commandString}`);
    await executeProcess({
      command,
      args,
      ignoreExitCode: true,
    });
  }

  const initialArtifactPaths = Array.isArray(artifacts.artifactsPaths)
    ? artifacts.artifactsPaths
    : [artifacts.artifactsPaths];

  const artifactPaths = await resolveGlobPatterns(initialArtifactPaths);

  ui().logger.log(
    `ESLint plugin resolved ${initialArtifactPaths.length} ${pluralizeToken('pattern', initialArtifactPaths.length)} to ${artifactPaths.length} eslint ${pluralizeToken('report', artifactPaths.length)}`,
  );

  return await Promise.all(
    artifactPaths.map(async artifactPath => {
      // ESLint CLI outputs raw ESLint.LintResult[], but we need LinterOutput format
      const results = await readJsonFile<ESLint.LintResult[]>(artifactPath);
      return {
        results,
        ruleOptionsPerFile: {}, // TODO: This could be enhanced to load actual rule options if needed
      };
    }),
  );
}
