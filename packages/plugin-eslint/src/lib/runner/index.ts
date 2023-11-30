import { mkdir, writeFile } from 'fs/promises';
import { platform } from 'os';
import { dirname, join } from 'path';
import type { Audit, AuditOutput, RunnerConfig } from '@code-pushup/models';
import { pluginWorkDir, readJsonFile, toArray } from '@code-pushup/utils';
import { lint } from './lint';
import { lintResultsToAudits } from './transform';

const WORKDIR = pluginWorkDir('eslint');
export const RUNNER_OUTPUT_PATH = join(WORKDIR, 'runner-output.json');
export const ESLINTRC_PATH = join(WORKDIR, '.eslintrc.json');

const AUDIT_SLUGS_SEP = ',';

export async function executeRunner(argv = process.argv): Promise<void> {
  const [slugs, eslintrc, ...patterns] = argv.slice(2);
  if (!slugs) {
    throw new Error('Invalid runner args - missing slugs argument');
  }
  if (!eslintrc) {
    throw new Error('Invalid runner args - missing eslintrc argument');
  }
  if (!patterns.length) {
    throw new Error('Invalid runner args - missing patterns argument');
  }

  const lintResults = await lint({
    // if file created from inline object, provide inline to preserve relative links
    eslintrc:
      eslintrc === ESLINTRC_PATH ? await readJsonFile(eslintrc) : eslintrc,
    patterns,
  });
  const failedAudits = lintResultsToAudits(lintResults);

  const audits = slugs.split(AUDIT_SLUGS_SEP).map(
    (slug): AuditOutput =>
      failedAudits.find(audit => audit.slug === slug) ?? {
        slug,
        score: 1,
        value: 0,
        details: { issues: [] },
      },
  );

  await mkdir(dirname(RUNNER_OUTPUT_PATH), { recursive: true });
  await writeFile(RUNNER_OUTPUT_PATH, JSON.stringify(audits));
}

export function createRunnerConfig(
  scriptPath: string,
  audits: Audit[],
  eslintrc: string,
  patterns: string | string[],
): RunnerConfig {
  return {
    command: 'node',
    args: [
      scriptPath,
      audits.map(audit => audit.slug).join(AUDIT_SLUGS_SEP),
      eslintrc,
      ...toArray(patterns).map(pattern =>
        platform() === 'win32' ? pattern : `'${pattern}'`,
      ),
    ],
    outputFile: RUNNER_OUTPUT_PATH,
  };
}
