import {
  copyFile,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type DiffResult,
  type FetchResult,
  type SimpleGit,
  simpleGit,
} from 'simple-git';
import type { MockInstance } from 'vitest';
import * as utils from '@code-pushup/utils';
import type {
  Comment,
  GitRefs,
  Logger,
  Options,
  ProviderAPIClient,
  RunResult,
} from './models';
import { runInCI } from './run';

describe('runInCI', () => {
  const fixturesDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    'mocks',
    'fixtures',
  );
  const workDir = join('tmp', 'ci', 'run-test');
  const outputDir = join(workDir, '.code-pushup');

  const logger: Logger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  const options = {
    bin: 'code-pushup',
    directory: workDir,
    logger,
  } satisfies Options;

  let git: SimpleGit;

  let cwdSpy: MockInstance<
    Parameters<typeof process.cwd>,
    ReturnType<typeof process.cwd>
  >;
  let executeProcessSpy: MockInstance<
    [utils.ProcessConfig],
    Promise<utils.ProcessResult>
  >;

  beforeEach(async () => {
    executeProcessSpy = vi
      .spyOn(utils, 'executeProcess')
      .mockImplementation(async ({ command, args }) => {
        if (command === options.bin) {
          await mkdir(outputDir, { recursive: true });
          let stdout = '';
          switch (args![0]) {
            case 'compare':
              await Promise.all(
                ['report-diff.json', 'report-diff.md'].map(file =>
                  copyFile(join(fixturesDir, file), join(outputDir, file)),
                ),
              );
              break;
            case 'print-config':
              stdout = await readFile(join(fixturesDir, 'config.json'), 'utf8');
              break;
            case 'merge-diffs': // not tested here
              break;
            default:
              const reportDir = join(fixturesDir, (await git.branch()).current);
              await Promise.all(
                ['report.json', 'report.md'].map(file =>
                  copyFile(join(reportDir, file), join(outputDir, file)),
                ),
              );
              break;
          }
          return { code: 0, stdout, stderr: '' } as utils.ProcessResult;
        }
        throw new Error(
          `Unexpected executeProcess call: ${command} ${args?.join(' ') ?? ''}`,
        );
      });

    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workDir);

    await rm(workDir, { recursive: true, force: true });
    await mkdir(workDir, { recursive: true });
    await copyFile(
      join(fixturesDir, 'code-pushup.config.ts'),
      join(workDir, 'code-pushup.config.ts'),
    );
    await writeFile(join(workDir, 'index.js'), 'console.log("Hello, world!")');

    git = simpleGit(workDir);

    vi.spyOn(git, 'fetch').mockResolvedValue({} as FetchResult);
    vi.spyOn(git, 'diffSummary').mockResolvedValue({
      files: [{ file: 'index.ts', binary: false }],
    } as DiffResult);
    vi.spyOn(git, 'diff').mockResolvedValue('');

    await git.init();
    await git.addConfig('user.name', 'John Doe');
    await git.addConfig('user.email', 'john.doe@example.com');
    await git.branch(['-M', 'main']);

    await git.add('index.js');
    await git.add('code-pushup.config.ts');
    await git.commit('Initial commit');
  });

  afterAll(async () => {
    cwdSpy.mockRestore();
    executeProcessSpy.mockRestore();

    await rm(workDir, { recursive: true, force: true });
  });

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
        artifacts: {
          report: {
            rootDir: outputDir,
            files: [
              join(outputDir, 'report.json'),
              join(outputDir, 'report.md'),
            ],
          },
        },
      } satisfies RunResult);

      expect(utils.executeProcess).toHaveBeenCalledTimes(1);
      expect(utils.executeProcess).toHaveBeenCalledWith({
        command: options.bin,
        args: [
          `--persist.outputDir=${outputDir}`,
          '--persist.filename=report',
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

  describe('pull request event', () => {
    let refs: GitRefs;
    let diffMdString: string;

    const mockComment: Comment = {
      id: 42,
      body: '... <!-- generated by @code-pushup/ci -->',
      url: 'https://fake.hosted.git/comments/42',
    };

    beforeEach(async () => {
      await git.checkoutLocalBranch('feature-1');

      await rename(join(workDir, 'index.js'), join(workDir, 'index.ts'));

      await git.add('index.ts');
      await git.commit('Convert JS file to TS');

      refs = {
        head: { ref: 'feature-1', sha: await git.revparse('feature-1') },
        base: { ref: 'main', sha: await git.revparse('main') },
      };

      diffMdString = await readFile(
        join(fixturesDir, 'report-diff.md'),
        'utf8',
      );
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
        artifacts: {
          report: {
            rootDir: outputDir,
            files: [
              join(outputDir, 'report.json'),
              join(outputDir, 'report.md'),
            ],
          },
          diff: {
            rootDir: outputDir,
            files: [
              join(outputDir, 'report-diff.json'),
              join(outputDir, 'report-diff.md'),
            ],
          },
        },
      } satisfies RunResult);

      expect(api.listComments).toHaveBeenCalledWith();
      expect(api.createComment).toHaveBeenCalledWith(
        expect.stringContaining(diffMdString),
      );
      expect(api.updateComment).not.toHaveBeenCalled();

      expect(utils.executeProcess).toHaveBeenCalledTimes(4);
      expect(utils.executeProcess).toHaveBeenNthCalledWith(1, {
        command: options.bin,
        args: [
          `--persist.outputDir=${outputDir}`,
          '--persist.filename=report',
          '--persist.format=json',
          '--persist.format=md',
        ],
        cwd: workDir,
      } satisfies utils.ProcessConfig);
      expect(utils.executeProcess).toHaveBeenNthCalledWith(2, {
        command: options.bin,
        args: ['print-config'],
        cwd: workDir,
      } satisfies utils.ProcessConfig);
      expect(utils.executeProcess).toHaveBeenNthCalledWith(3, {
        command: options.bin,
        args: [
          `--persist.outputDir=${outputDir}`,
          '--persist.filename=report',
          '--persist.format=json',
          '--persist.format=md',
        ],
        cwd: workDir,
      } satisfies utils.ProcessConfig);
      expect(utils.executeProcess).toHaveBeenNthCalledWith(4, {
        command: options.bin,
        args: [
          'compare',
          `--before=${join(outputDir, 'prev-report.json')}`,
          `--after=${join(outputDir, 'curr-report.json')}`,
          `--persist.outputDir=${outputDir}`,
          '--persist.filename=report',
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
          await copyFile(
            join(fixturesDir, 'main', 'report.json'),
            downloadPath,
          );
          return downloadPath;
        }),
      };

      await expect(runInCI(refs, api, options, git)).resolves.toEqual({
        mode: 'standalone',
        commentId: mockComment.id,
        newIssues: [],
        artifacts: {
          report: {
            rootDir: outputDir,
            files: [
              join(outputDir, 'report.json'),
              join(outputDir, 'report.md'),
            ],
          },
          diff: {
            rootDir: outputDir,
            files: [
              join(outputDir, 'report-diff.json'),
              join(outputDir, 'report-diff.md'),
            ],
          },
        },
      } satisfies RunResult);

      expect(api.listComments).toHaveBeenCalledWith();
      expect(api.updateComment).toHaveBeenCalledWith(
        mockComment.id,
        expect.stringContaining(diffMdString),
      );
      expect(api.createComment).not.toHaveBeenCalled();
      expect(api.downloadReportArtifact).toHaveBeenCalledWith();

      expect(utils.executeProcess).toHaveBeenCalledTimes(2);
      expect(utils.executeProcess).toHaveBeenNthCalledWith(1, {
        command: options.bin,
        args: [
          `--persist.outputDir=${outputDir}`,
          '--persist.filename=report',
          '--persist.format=json',
          '--persist.format=md',
        ],
        cwd: workDir,
      } satisfies utils.ProcessConfig);
      expect(utils.executeProcess).toHaveBeenNthCalledWith(2, {
        command: options.bin,
        args: [
          'compare',
          `--before=${join(outputDir, 'prev-report.json')}`,
          `--after=${join(outputDir, 'curr-report.json')}`,
          `--persist.outputDir=${outputDir}`,
          '--persist.filename=report',
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
