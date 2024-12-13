import { readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import type { SimpleGit } from 'simple-git';
import { afterEach } from 'vitest';
import {
  type GitRefs,
  type Options,
  type ProjectRunResult,
  type RunResult,
  runInCI,
} from '@code-pushup/ci';
import { TEST_SNAPSHOTS_DIR } from '@code-pushup/test-utils';
import { readJsonFile } from '@code-pushup/utils';
import { MOCK_API, MOCK_COMMENT } from '../mocks/api.js';
import { type TestRepo, setupTestRepo } from '../mocks/setup.js';

describe('CI - monorepo mode (npm workspaces)', () => {
  let repo: TestRepo;
  let git: SimpleGit;
  let options: Options;

  beforeEach(async () => {
    repo = await setupTestRepo('npm-workspaces');
    git = repo.git;
    options = {
      monorepo: true,
      directory: repo.baseDir,
      silent: true, // comment out for debugging
    };
  });

  afterEach(async () => {
    await repo.cleanup();
  });

  describe('push event', () => {
    beforeEach(async () => {
      await git.checkout('main');
    });

    it('should collect reports for all projects', async () => {
      await expect(
        runInCI(
          { head: { ref: 'main', sha: await git.revparse('main') } },
          MOCK_API,
          options,
          git,
        ),
      ).resolves.toEqual({
        mode: 'monorepo',
        projects: expect.arrayContaining<ProjectRunResult>([
          {
            name: '@example/cli',
            files: {
              report: {
                json: path.join(
                  repo.baseDir,
                  'packages/cli/.code-pushup/report.json',
                ),
                md: path.join(
                  repo.baseDir,
                  'packages/cli/.code-pushup/report.md',
                ),
              },
            },
          },
        ]),
      } satisfies RunResult);

      await expect(
        readJsonFile(
          path.join(repo.baseDir, 'packages/cli/.code-pushup/report.json'),
        ),
      ).resolves.toEqual(
        expect.objectContaining({
          plugins: [
            expect.objectContaining({
              audits: [
                expect.objectContaining({
                  score: 0,
                  displayValue: '0% converted',
                }),
              ],
            }),
          ],
        }),
      );
    });
  });

  describe('pull request event', () => {
    let refs: GitRefs;

    beforeEach(async () => {
      await git.checkoutLocalBranch('feature-1');

      await rename(
        path.join(repo.baseDir, 'packages/cli/src/bin.js'),
        path.join(repo.baseDir, 'packages/cli/src/bin.ts'),
      );
      await rename(
        path.join(repo.baseDir, 'packages/core/src/index.js'),
        path.join(repo.baseDir, 'packages/core/src/index.ts'),
      );
      await rename(
        path.join(repo.baseDir, 'packages/core/code-pushup.config.js'),
        path.join(repo.baseDir, 'packages/core/code-pushup.config.ts'),
      );

      await git.add('.');
      await git.commit('Convert JS files to TS');

      refs = {
        head: { ref: 'feature-1', sha: await git.revparse('feature-1') },
        base: { ref: 'main', sha: await git.revparse('main') },
      };
    });

    it('should compare reports for all packages and merge into Markdown comment', async () => {
      await expect(runInCI(refs, MOCK_API, options, git)).resolves.toEqual({
        mode: 'monorepo',
        commentId: MOCK_COMMENT.id,
        diffPath: path.join(repo.baseDir, '.code-pushup/merged-report-diff.md'),
        projects: expect.arrayContaining<ProjectRunResult>([
          {
            name: '@example/core',
            files: {
              report: {
                json: path.join(
                  repo.baseDir,
                  'packages/core/.code-pushup/report.json',
                ),
                md: path.join(
                  repo.baseDir,
                  'packages/core/.code-pushup/report.md',
                ),
              },
              diff: {
                json: path.join(
                  repo.baseDir,
                  'packages/core/.code-pushup/report-diff.json',
                ),
                md: path.join(
                  repo.baseDir,
                  'packages/core/.code-pushup/report-diff.md',
                ),
              },
            },
            newIssues: [],
          },
        ]),
      } satisfies RunResult);

      const mdPromise = readFile(
        path.join(repo.baseDir, '.code-pushup/merged-report-diff.md'),
        'utf8',
      );
      await expect(mdPromise).resolves.toBeTruthy();
      const md = await mdPromise;
      await expect(
        md.replace(/[\da-f]{40}/g, '`<commit-sha>`'),
      ).toMatchFileSnapshot(
        path.join(TEST_SNAPSHOTS_DIR, 'npm-workspaces-report-diff.md'),
      );
    });
  });
});
