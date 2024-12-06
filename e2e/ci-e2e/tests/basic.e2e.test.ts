import { readFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import type { SimpleGit } from 'simple-git';
import { afterEach } from 'vitest';
import {
  type GitRefs,
  type Options,
  type RunResult,
  runInCI,
} from '@code-pushup/ci';
import { TEST_SNAPSHOTS_DIR } from '@code-pushup/test-utils';
import { MOCK_API, MOCK_COMMENT } from '../mocks/api';
import { type TestRepo, setupTestRepo } from '../mocks/setup';

describe('CI - standalone mode', () => {
  let repo: TestRepo;
  let git: SimpleGit;
  let options: Options;

  beforeEach(async () => {
    repo = await setupTestRepo('basic');
    git = repo.git;
    options = { directory: repo.baseDir };
  });

  afterEach(async () => {
    await repo.cleanup();
  });

  describe('push event', () => {
    beforeEach(async () => {
      await git.checkout('main');
    });

    it('should collect report', async () => {
      await expect(
        runInCI(
          { head: { ref: 'main', sha: await git.revparse('main') } },
          MOCK_API,
          options,
          git,
        ),
      ).resolves.toEqual({
        mode: 'standalone',
        files: {
          report: {
            json: join(repo.baseDir, '.code-pushup/report.json'),
            md: join(repo.baseDir, '.code-pushup/report.md'),
          },
        },
      } satisfies RunResult);

      const jsonPromise = readFile(
        join(repo.baseDir, '.code-pushup/report.json'),
        'utf8',
      );
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
    let refs: GitRefs;

    beforeEach(async () => {
      await git.checkoutLocalBranch('feature-1');

      await rename(
        join(repo.baseDir, 'index.js'),
        join(repo.baseDir, 'index.ts'),
      );

      await git.add('index.ts');
      await git.commit('Convert JS file to TS');

      refs = {
        head: { ref: 'feature-1', sha: await git.revparse('feature-1') },
        base: { ref: 'main', sha: await git.revparse('main') },
      };
    });

    it('should compare reports', async () => {
      await expect(runInCI(refs, MOCK_API, options, git)).resolves.toEqual({
        mode: 'standalone',
        commentId: MOCK_COMMENT.id,
        newIssues: [],
        files: {
          report: {
            json: join(repo.baseDir, '.code-pushup/report.json'),
            md: join(repo.baseDir, '.code-pushup/report.md'),
          },
          diff: {
            json: join(repo.baseDir, '.code-pushup/report-diff.json'),
            md: join(repo.baseDir, '.code-pushup/report-diff.md'),
          },
        },
      } satisfies RunResult);

      const mdPromise = readFile(
        join(repo.baseDir, '.code-pushup/report-diff.md'),
        'utf8',
      );
      await expect(mdPromise).resolves.toBeTruthy();
      const md = await mdPromise;
      await expect(
        md.replace(/[\da-f]{40}/g, '`<commit-sha>`'),
      ).toMatchFileSnapshot(join(TEST_SNAPSHOTS_DIR, 'basic-report-diff.md'));
    });
  });
});
