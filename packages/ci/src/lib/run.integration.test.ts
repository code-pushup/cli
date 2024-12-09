import {
  copyFile,
  cp,
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type SimpleGit, simpleGit } from 'simple-git';
import type { MockInstance } from 'vitest';
import type { CoreConfig } from '@code-pushup/models';
import { cleanTestFolder, teardownTestFolder } from '@code-pushup/test-setup';
import { initGitRepo, simulateGitFetch } from '@code-pushup/test-utils';
import * as utils from '@code-pushup/utils';
import type {
  Comment,
  GitRefs,
  Logger,
  Options,
  ProviderAPIClient,
  RunResult,
} from './models.js';
import type { MonorepoTool } from './monorepo/index.js';
import { runInCI } from './run.js';

describe('runInCI', () => {
  const fixturesDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    'mocks',
    'fixtures',
  );
  const reportsDir = join(fixturesDir, 'outputs');
  const workDir = join(process.cwd(), 'tmp', 'ci', 'run-test');

  const fixturePaths = {
    reports: {
      before: {
        json: join(reportsDir, 'report-before.json'),
        md: join(reportsDir, 'report-before.md'),
      },
      after: {
        json: join(reportsDir, 'report-after.json'),
        md: join(reportsDir, 'report-after.md'),
      },
    },
    diffs: {
      project: {
        json: join(reportsDir, 'diff-project.json'),
        md: join(reportsDir, 'diff-project.md'),
      },
    },
    config: join(reportsDir, 'config.json'),
  };

  const logger: Logger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  const options = {
    bin: 'npx code-pushup',
    directory: workDir,
    logger,
  } satisfies Options;

  const mockComment: Comment = {
    id: 42,
    body: '... <!-- generated by @code-pushup/ci -->',
    url: 'https://fake.hosted.git/comments/42',
  };

  let git: SimpleGit;

  let cwdSpy: MockInstance<
    Parameters<typeof process.cwd>,
    ReturnType<typeof process.cwd>
  >;
  let executeProcessSpy: MockInstance<
    [utils.ProcessConfig],
    Promise<utils.ProcessResult>
  >;

  async function simulateCodePushUpExecution({
    command,
    args,
    cwd,
  }: utils.ProcessConfig): Promise<utils.ProcessResult> {
    const nxMatch = command.match(/nx run (\w+):code-pushup/);
    const outputDir = nxMatch
      ? join(workDir, `packages/${nxMatch[1]}/.code-pushup`)
      : join(cwd as string, '.code-pushup');
    await mkdir(outputDir, { recursive: true });
    let stdout = '';

    switch (args![0]) {
      case 'compare':
        const diffs = fixturePaths.diffs.project;
        await copyFile(diffs.json, join(outputDir, 'report-diff.json'));
        await copyFile(diffs.md, join(outputDir, 'report-diff.md'));
        break;

      case 'print-config':
        stdout = await readFile(fixturePaths.config, 'utf8');
        if (nxMatch) {
          // simulate effect of custom persist.outputDir per Nx project
          const config = JSON.parse(stdout) as CoreConfig;
          // eslint-disable-next-line functional/immutable-data
          config.persist!.outputDir = outputDir;
          stdout = JSON.stringify(config, null, 2);
        }
        break;

      case 'merge-diffs': // not tested here
        break;

      default:
        const kind =
          (await git.branch()).current === 'main' ? 'before' : 'after';
        const reports = fixturePaths.reports[kind];
        await copyFile(reports.json, join(outputDir, 'report.json'));
        await copyFile(reports.md, join(outputDir, 'report.md'));
        break;
    }

    return { code: 0, stdout, stderr: '' } as utils.ProcessResult;
  }

  beforeEach(async () => {
    const originalExecuteProcess = utils.executeProcess;
    executeProcessSpy = vi
      .spyOn(utils, 'executeProcess')
      .mockImplementation(cfg => {
        if (cfg.command.includes('code-pushup')) {
          return simulateCodePushUpExecution(cfg);
        }
        return originalExecuteProcess(cfg);
      });

    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workDir);

    await cleanTestFolder(workDir);

    git = await initGitRepo(simpleGit, { baseDir: workDir });
    await simulateGitFetch(git);

    await writeFile(join(workDir, 'index.js'), 'console.log("Hello, world!")');
    await git.add('index.js');
    await git.commit('Initial commit');
  });

  afterAll(async () => {
    cwdSpy.mockRestore();
    executeProcessSpy.mockRestore();

    await teardownTestFolder(workDir);
  });

  describe('standalone mode', () => {
    const outputDir = join(workDir, '.code-pushup');

    describe('push event', () => {
      beforeEach(async () => {
        await git.checkout('main');
      });

      it('should collect report', async () => {
        await expect(
          runInCI(
            { head: { ref: 'main', sha: await git.revparse('main') } },
            {} as ProviderAPIClient,
            options,
            git,
          ),
        ).resolves.toEqual({
          mode: 'standalone',
          files: {
            report: {
              json: join(outputDir, 'report.json'),
              md: join(outputDir, 'report.md'),
            },
          },
        } satisfies RunResult);

        expect(utils.executeProcess).toHaveBeenCalledTimes(2);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(1, {
          command: options.bin,
          args: ['print-config'],
          cwd: workDir,
        } satisfies utils.ProcessConfig);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(2, {
          command: options.bin,
          args: ['--persist.format=json', '--persist.format=md'],
          cwd: workDir,
        } satisfies utils.ProcessConfig);

        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
        expect(logger.debug).toHaveBeenCalled();
      });
    });

    describe('pull request event', () => {
      let refs: GitRefs;
      let diffMdString: string;

      beforeEach(async () => {
        await git.checkoutLocalBranch('feature-1');

        await rename(join(workDir, 'index.js'), join(workDir, 'index.ts'));

        await git.add('index.ts');
        await git.commit('Convert JS file to TS');

        refs = {
          head: { ref: 'feature-1', sha: await git.revparse('feature-1') },
          base: { ref: 'main', sha: await git.revparse('main') },
        };

        diffMdString = await readFile(fixturePaths.diffs.project.md, 'utf8');
      });

      it('should collect both reports when uncached, compare and create new comment', async () => {
        const api: ProviderAPIClient = {
          maxCommentChars: 1_000_000,
          createComment: vi.fn().mockResolvedValue(mockComment),
          updateComment: vi.fn(),
          listComments: vi.fn().mockResolvedValue([]),
        };

        await expect(runInCI(refs, api, options, git)).resolves.toEqual({
          mode: 'standalone',
          commentId: mockComment.id,
          newIssues: [],
          files: {
            report: {
              json: join(outputDir, 'report.json'),
              md: join(outputDir, 'report.md'),
            },
            diff: {
              json: join(outputDir, 'report-diff.json'),
              md: join(outputDir, 'report-diff.md'),
            },
          },
        } satisfies RunResult);

        expect(api.listComments).toHaveBeenCalledWith();
        expect(api.createComment).toHaveBeenCalledWith(
          expect.stringContaining(diffMdString),
        );
        expect(api.updateComment).not.toHaveBeenCalled();

        expect(utils.executeProcess).toHaveBeenCalledTimes(5);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(1, {
          command: options.bin,
          args: ['print-config'],
          cwd: workDir,
        } satisfies utils.ProcessConfig);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(2, {
          command: options.bin,
          args: ['--persist.format=json', '--persist.format=md'],
          cwd: workDir,
        } satisfies utils.ProcessConfig);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(3, {
          command: options.bin,
          args: ['print-config'],
          cwd: workDir,
        } satisfies utils.ProcessConfig);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(4, {
          command: options.bin,
          args: ['--persist.format=json', '--persist.format=md'],
          cwd: workDir,
        } satisfies utils.ProcessConfig);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(5, {
          command: options.bin,
          args: [
            'compare',
            `--before=${join(outputDir, 'prev-report.json')}`,
            `--after=${join(outputDir, 'curr-report.json')}`,
            '--persist.format=json',
            '--persist.format=md',
          ],
          cwd: workDir,
        } satisfies utils.ProcessConfig);

        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
        expect(logger.debug).toHaveBeenCalled();
      });

      it('should collect new report and use cached old report, compare and update existing comment', async () => {
        const api: ProviderAPIClient = {
          maxCommentChars: 1_000_000,
          createComment: vi.fn(),
          updateComment: vi.fn().mockResolvedValue(mockComment),
          listComments: vi.fn().mockResolvedValue([mockComment]),
          downloadReportArtifact: vi.fn().mockImplementation(async () => {
            const downloadPath = join(workDir, 'downloaded-report.json');
            await copyFile(fixturePaths.reports.before.json, downloadPath);
            return downloadPath;
          }),
        };

        await expect(runInCI(refs, api, options, git)).resolves.toEqual({
          mode: 'standalone',
          commentId: mockComment.id,
          newIssues: [],
          files: {
            report: {
              json: join(outputDir, 'report.json'),
              md: join(outputDir, 'report.md'),
            },
            diff: {
              json: join(outputDir, 'report-diff.json'),
              md: join(outputDir, 'report-diff.md'),
            },
          },
        } satisfies RunResult);

        expect(api.listComments).toHaveBeenCalledWith();
        expect(api.updateComment).toHaveBeenCalledWith(
          mockComment.id,
          expect.stringContaining(diffMdString),
        );
        expect(api.createComment).not.toHaveBeenCalled();
        expect(api.downloadReportArtifact).toHaveBeenCalledWith(undefined);

        expect(utils.executeProcess).toHaveBeenCalledTimes(3);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(1, {
          command: options.bin,
          args: ['print-config'],
          cwd: workDir,
        } satisfies utils.ProcessConfig);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(2, {
          command: options.bin,
          args: ['--persist.format=json', '--persist.format=md'],
          cwd: workDir,
        } satisfies utils.ProcessConfig);
        expect(utils.executeProcess).toHaveBeenNthCalledWith(3, {
          command: options.bin,
          args: [
            'compare',
            `--before=${join(outputDir, 'prev-report.json')}`,
            `--after=${join(outputDir, 'curr-report.json')}`,
            '--persist.format=json',
            '--persist.format=md',
          ],
          cwd: workDir,
        } satisfies utils.ProcessConfig);

        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
        expect(logger.debug).toHaveBeenCalled();
      });
    });
  });

  describe.each<[MonorepoTool, string]>([
    ['nx', expect.stringMatching(/^npx nx run \w+:code-pushup --$/)],
    ['turbo', 'npx turbo run code-pushup --'],
    ['pnpm', 'pnpm run code-pushup'],
    ['yarn', 'yarn run code-pushup'],
    ['npm', 'npm run code-pushup --'],
  ])('monorepo mode - %s', (tool, bin) => {
    beforeEach(async () => {
      const monorepoDir = join(fixturesDir, 'monorepos', 'tools', tool);
      await cp(monorepoDir, workDir, { recursive: true });
      await git.add('.');
      await git.commit(`Create packages in ${tool} monorepo`);
    });

    describe('push event', () => {
      beforeEach(async () => {
        await git.checkout('main');
      });

      it('should collect reports for all projects', async () => {
        await expect(
          runInCI(
            { head: { ref: 'main', sha: await git.revparse('main') } },
            {} as ProviderAPIClient,
            { ...options, monorepo: tool },
            git,
          ),
        ).resolves.toEqual({
          mode: 'monorepo',
          projects: [
            {
              name: 'cli',
              files: {
                report: {
                  json: join(workDir, 'packages/cli/.code-pushup/report.json'),
                  md: join(workDir, 'packages/cli/.code-pushup/report.md'),
                },
              },
            },
            {
              name: 'core',
              files: {
                report: {
                  json: join(workDir, 'packages/core/.code-pushup/report.json'),
                  md: join(workDir, 'packages/core/.code-pushup/report.md'),
                },
              },
            },
            {
              name: 'utils',
              files: {
                report: {
                  json: join(
                    workDir,
                    'packages/utils/.code-pushup/report.json',
                  ),
                  md: join(workDir, 'packages/utils/.code-pushup/report.md'),
                },
              },
            },
          ],
        } satisfies RunResult);

        expect(executeProcessSpy.mock.calls.length).toBeGreaterThanOrEqual(6);
        expect(utils.executeProcess).toHaveBeenCalledWith({
          command: bin,
          args: ['print-config'],
          cwd: expect.stringContaining(workDir),
        } satisfies utils.ProcessConfig);
        expect(utils.executeProcess).toHaveBeenCalledWith({
          command: bin,
          args: ['--persist.format=json', '--persist.format=md'],
          cwd: expect.stringContaining(workDir),
        } satisfies utils.ProcessConfig);

        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
        expect(logger.debug).toHaveBeenCalled();
      });
    });
  });
});
