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
import {
  type Comment,
  type GitRefs,
  type Options,
  type ProviderAPIClient,
  type RunResult,
  runInCI,
} from '@code-pushup/ci';
import { initGitRepo } from '@code-pushup/test-utils';

describe('CI package', () => {
  const fixturesDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    'mocks',
    'fixtures',
  );
  const workDir = join(
    process.cwd(),
    'tmp',
    'e2e',
    'ci-e2e',
    '__test__',
    'ci-test-repo',
  );
  const outputDir = join(workDir, '.code-pushup');

  const options = {
    directory: workDir,
  } satisfies Options;

  let git: SimpleGit;

  beforeEach(async () => {
    await rm(workDir, { recursive: true, force: true });
    await mkdir(workDir, { recursive: true });
    await copyFile(
      join(fixturesDir, 'code-pushup.config.ts'),
      join(workDir, 'code-pushup.config.ts'),
    );
    await writeFile(join(workDir, 'index.js'), 'console.log("Hello, world!")');

    git = await initGitRepo(simpleGit, { baseDir: workDir });

    vi.spyOn(git, 'fetch').mockResolvedValue({} as FetchResult);
    vi.spyOn(git, 'diffSummary').mockResolvedValue({
      files: [{ file: 'index.ts', binary: false }],
    } as DiffResult);
    vi.spyOn(git, 'diff').mockResolvedValue('');

    await git.add('index.js');
    await git.add('code-pushup.config.ts');
    await git.commit('Initial commit');
  });

  afterAll(async () => {
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

      const jsonPromise = readFile(join(outputDir, 'report.json'), 'utf8');
      await expect(jsonPromise).resolves.toBeTruthy();
      const report = JSON.parse(await jsonPromise) as Report;
      expect(report).toEqual(
        expect.objectContaining({
          plugins: [
            expect.objectContaining({
              slug: 'ts-migration',
              audits: [
                expect.objectContaining({
                  score: 0.5,
                  displayValue: '50% converted',
                }),
              ],
            }),
          ],
        }),
      );
    });
  });

  describe('pull request event', () => {
    const comment: Comment = {
      id: 42,
      body: '... <!-- generated by @code-pushup/ci -->',
      url: 'https://github.com/<owner>/<repo>/pull/1#issuecomment-42',
    };
    const api: ProviderAPIClient = {
      maxCommentChars: 1_000_000,
      createComment: () => Promise.resolve(comment),
      updateComment: () => Promise.resolve(comment),
      listComments: () => Promise.resolve([]),
    };

    let refs: GitRefs;

    beforeEach(async () => {
      await git.checkoutLocalBranch('feature-1');

      await rename(join(workDir, 'index.js'), join(workDir, 'index.ts'));

      await git.add('index.ts');
      await git.commit('Convert JS file to TS');

      refs = {
        head: { ref: 'feature-1', sha: await git.revparse('feature-1') },
        base: { ref: 'main', sha: await git.revparse('main') },
      };
    });

    it('should compare reports', async () => {
      await expect(runInCI(refs, api, options, git)).resolves.toEqual({
        mode: 'standalone',
        commentId: comment.id,
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

      const mdPromise = readFile(join(outputDir, 'report-diff.md'), 'utf8');
      await expect(mdPromise).resolves.toBeTruthy();
      const md = await mdPromise;
      await expect(
        md.replace(/[\da-f]{40}/g, '`<commit-sha>`'),
      ).toMatchFileSnapshot('__snapshots__/report-diff.md');
    });
  });
});
