import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { simpleGit } from 'simple-git';
import type { ReportsDiff } from '@code-pushup/models';
import { cleanTestFolder } from '@code-pushup/test-setup';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('CLI compare', () => {
  const envRoot = join('examples', 'react-todos-app');
  const git = simpleGit();

  beforeEach(async () => {
    if (await git.diff(['--', envRoot])) {
      throw new Error(
        `Unstaged changes found in ${envRoot}, please stage or commit them to prevent E2E tests interfering`,
      );
    }
    await cleanTestFolder(join(envRoot, '.code-pushup'));
    await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--persist.filename=source-report'],
      cwd: envRoot,
    });
    // adding items to create a report diff
    const itemsFile = join(envRoot, 'items.json');
    const items = JSON.parse((await readFile(itemsFile)).toString());
    await writeFile(itemsFile, JSON.stringify([...items, 4, 5, 6, 7], null, 2));

    await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--persist.filename=target-report'],
      cwd: envRoot,
    });
  }, 20_000);

  afterEach(async () => {
    await git.checkout(['--', envRoot]);
    await cleanTestFolder('tmp/e2e');
  });

  it('should compare report.json files and create report-diff.json and report-diff.md', async () => {
    await executeProcess({
      command: 'code-pushup',
      args: [
        'compare',
        `--before=${join('.code-pushup', 'source-report.json')}`,
        `--after=${join('.code-pushup', 'target-report.json')}`,
      ],
      cwd: envRoot,
    });

    const reportsDiff = await readJsonFile<ReportsDiff>(
      join(envRoot, '.code-pushup', 'report-diff.json'),
    );
    expect(reportsDiff).toMatchSnapshot({
      commits: expect.any(Object),
      date: expect.any(String),
      duration: expect.any(Number),
      version: expect.any(String),
    });

    const reportsDiffMd = await readTextFile(
      join(envRoot, '.code-pushup', 'report-diff.md'),
    );
    // commits are variable, replace SHAs with placeholders
    const sanitizedMd = reportsDiffMd.replace(/[\da-f]{40}/g, '`<commit-sha>`');
    await expect(sanitizedMd).toMatchFileSnapshot(
      '__snapshots__/compare.report-diff.md',
    );
  });
});
