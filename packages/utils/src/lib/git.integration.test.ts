import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import { expect } from 'vitest';
import { getGitRoot, getLatestCommit, toGitPath } from './git';
import { toUnixPath } from './transform';

describe('git utils', () => {
  const baseDir = join(process.cwd(), 'tmp', 'testing-git-repo');
  let git: SimpleGit;

  beforeAll(async () => {
    await mkdir(baseDir, { recursive: true });
    await writeFile(join(baseDir, 'README.md'), '# hello-world\n');

    git = simpleGit(baseDir);
    await git.init();

    await git.addConfig('user.name', 'John Doe');
    await git.addConfig('user.email', 'john.doe@example.com');

    await git.add('README.md');
    await git.commit('Create README');
  });

  afterAll(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should log latest commit', async () => {
    const gitCommitDateRegex =
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2} \d{2}:\d{2}:\d{2} \d{4} [+|-]\d{4}$/;

    await expect(getLatestCommit(git)).resolves.toEqual({
      hash: expect.stringMatching(/^[\da-f]{40}$/),
      message: 'Create README',
      author: 'John Doe',
      date: expect.stringMatching(gitCommitDateRegex),
    });
  });

  it('should find Git root', async () => {
    await expect(getGitRoot(git)).resolves.toBe(toUnixPath(baseDir));
  });

  it('should convert absolute path to relative Git path', async () => {
    await expect(
      toGitPath(join(process.cwd(), 'src', 'utils.ts')),
    ).resolves.toBe('src/utils.ts');
  });

  it('should convert relative Windows path to relative Git path', async () => {
    await expect(toGitPath('Backend\\API\\Startup.cs')).resolves.toBe(
      'Backend/API/Startup.cs',
    );
  });

  it('should keep relative Unix path as is (already a Git path)', async () => {
    await expect(toGitPath('Backend/API/Startup.cs')).resolves.toBe(
      'Backend/API/Startup.cs',
    );
  });
});
