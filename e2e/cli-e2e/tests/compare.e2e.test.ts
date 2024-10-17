import { simpleGit } from 'simple-git';
import type { ReportsDiff } from '@code-pushup/models';
import { cleanTestFolder } from '@code-pushup/test-setup';
import { executeProcess, readJsonFile, readTextFile } from '@code-pushup/utils';

describe('CLI compare', () => {
  const git = simpleGit();

  beforeEach(async () => {
    if (await git.diff(['--', 'examples/react-todos-app'])) {
      throw new Error(
        'Unstaged changes found in examples/react-todos-app, please stage or commit them to prevent E2E tests interfering',
      );
    }
    await cleanTestFolder('tmp/e2e/react-todos-app');
    await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--persist.filename=source-report',
        '--onlyPlugins=eslint',
      ],
      cwd: 'examples/react-todos-app',
    });
    await executeProcess({
      command: 'npx',
      args: ['eslint', '--fix', 'src', '--ext=js,jsx'],
      cwd: 'examples/react-todos-app',
    });
    await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--persist.filename=target-report',
        '--onlyPlugins=eslint',
      ],
      cwd: 'examples/react-todos-app',
    });
  }, 20_000);

  afterEach(async () => {
    await git.checkout(['--', 'examples/react-todos-app']);
    await cleanTestFolder('tmp/e2e');
  });

  it('should compare report.json files and create report-diff.json and report-diff.md', async () => {
    await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'compare',
        '--before=../../tmp/e2e/react-todos-app/source-report.json',
        '--after=../../tmp/e2e/react-todos-app/target-report.json',
      ],
      cwd: 'examples/react-todos-app',
    });

    const reportsDiff = await readJsonFile<ReportsDiff>(
      'tmp/e2e/react-todos-app/report-diff.json',
    );
    expect(reportsDiff).toMatchSnapshot({
      commits: expect.any(Object),
      date: expect.any(String),
      duration: expect.any(Number),
      version: expect.any(String),
    });

    const reportsDiffMd = await readTextFile(
      'tmp/e2e/react-todos-app/report-diff.md',
    );
    // commits are variable, replace SHAs with placeholders
    const sanitizedMd = reportsDiffMd.replace(/[\da-f]{40}/g, '`<commit-sha>`');
    await expect(sanitizedMd).toMatchFileSnapshot(
      '__snapshots__/compare.report-diff.md',
    );
  });
});
