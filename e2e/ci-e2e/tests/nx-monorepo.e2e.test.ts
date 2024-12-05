import { join } from 'node:path';
import type { SimpleGit } from 'simple-git';
import { afterEach } from 'vitest';
import { type Options, type RunResult, runInCI } from '@code-pushup/ci';
import { readJsonFile } from '@code-pushup/utils';
import { MOCK_API } from '../mocks/api';
import { type TestRepo, setupTestRepo } from '../mocks/setup';

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
        projects: expect.arrayContaining([
          {
            name: 'api',
            files: {
              report: {
                json: join(repo.baseDir, 'apps/api/.code-pushup/report.json'),
                md: join(repo.baseDir, 'apps/api/.code-pushup/report.md'),
              },
            },
          },
        ]),
      } satisfies RunResult);

      await expect(
        readJsonFile(join(repo.baseDir, 'apps/api/.code-pushup/report.json')),
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
        readJsonFile(join(repo.baseDir, 'libs/ui/.code-pushup/report.json')),
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

  // TODO: pull request event
});
