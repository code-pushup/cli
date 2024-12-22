import { readFile, rename, writeFile } from 'node:fs/promises';
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

describe('CI - monorepo mode (Nx)', () => {
  let repo: TestRepo;
  let git: SimpleGit;
  let options: Options;

  beforeEach(async () => {
    repo = await setupTestRepo('nx-monorepo');
    git = repo.git;
    options = {
      monorepo: true,
      directory: repo.baseDir,
      parallel: true,
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
            name: 'api',
            files: {
              report: {
                json: path.join(
                  repo.baseDir,
                  'apps/api/.code-pushup/report.json',
                ),
                md: path.join(repo.baseDir, 'apps/api/.code-pushup/report.md'),
              },
            },
          },
        ]),
      } satisfies RunResult);

      await expect(
        readJsonFile(
          path.join(repo.baseDir, 'apps/api/.code-pushup/report.json'),
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
      await expect(
        readJsonFile(
          path.join(repo.baseDir, 'libs/ui/.code-pushup/report.json'),
        ),
      ).resolves.toEqual(
        expect.objectContaining({
          plugins: [
            expect.objectContaining({
              audits: [
                expect.objectContaining({
                  score: expect.closeTo(0.666),
                  displayValue: '67% converted',
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
        path.join(repo.baseDir, 'apps/api/src/index.js'),
        path.join(repo.baseDir, 'apps/api/src/index.ts'),
      );
      await rename(
        path.join(repo.baseDir, 'apps/web/src/index.ts'),
        path.join(repo.baseDir, 'apps/web/src/index.js'),
      );
      await rename(
        path.join(repo.baseDir, 'libs/ui/code-pushup.config.js'),
        path.join(repo.baseDir, 'libs/ui/code-pushup.config.ts'),
      );
      await writeFile(
        path.join(repo.baseDir, 'libs/ui/project.json'),
        (
          await readFile(
            path.join(repo.baseDir, 'libs/ui/project.json'),
            'utf8',
          )
        ).replace('code-pushup.config.js', 'code-pushup.config.ts'),
      );

      await git.add('.');
      await git.commit('Convert JS->TS for api and ui, TS->JS for web');

      refs = {
        head: { ref: 'feature-1', sha: await git.revparse('feature-1') },
        base: { ref: 'main', sha: await git.revparse('main') },
      };
    });

    it('should compare reports for all projects, detect new issues and merge into Markdown comment', async () => {
      await expect(runInCI(refs, MOCK_API, options, git)).resolves.toEqual({
        mode: 'monorepo',
        commentId: MOCK_COMMENT.id,
        diffPath: path.join(repo.baseDir, '.code-pushup/merged-report-diff.md'),
        projects: expect.arrayContaining<ProjectRunResult>([
          {
            name: 'web',
            files: {
              report: {
                json: path.join(
                  repo.baseDir,
                  'apps/web/.code-pushup/report.json',
                ),
                md: path.join(repo.baseDir, 'apps/web/.code-pushup/report.md'),
              },
              diff: {
                json: path.join(
                  repo.baseDir,
                  'apps/web/.code-pushup/report-diff.json',
                ),
                md: path.join(
                  repo.baseDir,
                  'apps/web/.code-pushup/report-diff.md',
                ),
              },
            },
            newIssues: [
              {
                message: 'Use .ts file extension instead of .js',
                severity: 'warning',
                source: { file: 'apps/web/src/index.js' },
                plugin: expect.objectContaining({ slug: 'ts-migration' }),
                audit: expect.objectContaining({ slug: 'ts-files' }),
              },
            ],
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
        path.join(TEST_SNAPSHOTS_DIR, 'nx-monorepo-report-diff.md'),
      );
    });
  });
});
