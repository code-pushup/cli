import { cp, readFile, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type DiffResult,
  type FetchResult,
  type SimpleGit,
  simpleGit,
} from 'simple-git';
import { afterEach } from 'vitest';
import {
  type Comment,
  type GitRefs,
  type Options,
  type ProviderAPIClient,
  type RunResult,
  runInCI,
} from '@code-pushup/ci';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  TEST_SNAPSHOTS_DIR,
  initGitRepo,
} from '@code-pushup/test-utils';

describe('CI package', () => {
  const fixturesDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    'mocks',
    'fixtures',
    'ci-test-repo',
  );
  const ciSetupRepoDir = join(
    process.cwd(),
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'ci-test-repo',
  );
  const outputDir = join(ciSetupRepoDir, '.code-pushup');

  const options = {
    directory: ciSetupRepoDir,
  } satisfies Options;

  let git: SimpleGit;

  beforeEach(async () => {
    await cp(fixturesDir, ciSetupRepoDir, { recursive: true });

    git = await initGitRepo(simpleGit, { baseDir: ciSetupRepoDir });

    vi.spyOn(git, 'fetch').mockResolvedValue({} as FetchResult);
    vi.spyOn(git, 'diffSummary').mockResolvedValue({
      files: [{ file: 'index.ts', binary: false }],
    } as DiffResult);
    vi.spyOn(git, 'diff').mockResolvedValue('');

    await git.add('index.js');
    await git.add('code-pushup.config.ts');
    await git.commit('Initial commit');
  });

  afterEach(async () => {
    await teardownTestFolder(ciSetupRepoDir);
  });

  afterAll(async () => {
    await teardownTestFolder(ciSetupRepoDir);
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

      await rename(
        join(ciSetupRepoDir, 'index.js'),
        join(ciSetupRepoDir, 'index.ts'),
      );

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
      ).toMatchFileSnapshot(join(TEST_SNAPSHOTS_DIR, 'report-diff.md'));
    });
  });
});