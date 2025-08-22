import type { ESLint } from 'eslint';
import { glob } from 'glob';
import type { PluginArtifactOptions } from '@code-pushup/models';
import { executeProcess, readJsonFile, ui } from '@code-pushup/utils';
import type { LinterOutput } from './types.js';

export async function loadArtifacts(
  artifacts: PluginArtifactOptions,
): Promise<LinterOutput[]> {
  if (artifacts.generateArtifactsCommand) {
    const { command, args = [] } =
      typeof artifacts.generateArtifactsCommand === 'string'
        ? { command: artifacts.generateArtifactsCommand }
        : artifacts.generateArtifactsCommand;

    await executeProcess({
      command,
      args,
      ignoreExitCode: true,
    });
  }

  const initialArtifactPaths = Array.isArray(artifacts.artifactsPaths)
    ? artifacts.artifactsPaths
    : [artifacts.artifactsPaths];

  const artifactPaths = await glob(initialArtifactPaths);

  return await Promise.all(
    artifactPaths.map(async artifactPath => {
      // ESLint CLI outputs raw ESLint.LintResult[], but we need LinterOutput format
      const results = await readJsonFile<ESLint.LintResult[]>(artifactPath);
      return {
        results,
        ruleOptionsPerFile: {}, // TODO
      };
    }),
  );
}
