import { simpleGit } from 'simple-git';
import { ReportsDiff } from '@code-pushup/models';
import { cleanTestFolder } from '@code-pushup/test-setup';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('CLI compare', () => {
  const git = simpleGit();

  beforeEach(async () => {
    if (await git.diff(['--', 'examples/react-todos-app'])) {
      throw new Error(
        'Unstaged changes found in examples/react-todos-app, please stage or commit them to prevent E2E tests interfering',
      );
    }
    await cleanTestFolder('tmp/e2e');
    await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--persist.filename=source-report'],
      cwd: 'examples/react-todos-app',
    });
    await executeProcess({
      command: 'npx',
      args: ['eslint', '--fix', 'src', '--ext=js,jsx'],
      cwd: 'examples/react-todos-app',
    });
    await executeProcess({
      command: 'code-pushup',
      args: ['collect', '--persist.filename=target-report'],
      cwd: 'examples/react-todos-app',
    });
  });

  afterEach(async () => {
    await git.checkout(['--', 'examples/react-todos-app']);
    await cleanTestFolder('tmp/e2e');
  });

  it('should compare report.json files and create report-diff.json', async () => {
    await executeProcess({
      command: 'code-pushup',
      args: [
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
    });
  });
});
