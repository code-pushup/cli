import type { SimpleGit, StatusResult } from 'simple-git';
import { describe, expect } from 'vitest';
import { GitStatusError, formatGitPath, guardAgainstLocalChanges } from './git';

describe('guardAgainstLocalChanges', () => {
  it('should throw if no files are present', async () => {
    await expect(
      guardAgainstLocalChanges({
        status: () => Promise.resolve({ files: [''] }),
      } as unknown as SimpleGit),
    ).rejects.toThrow(
      new GitStatusError({ files: [''] } as unknown as StatusResult),
    );
  });
});

describe('formatGitPath', () => {
  it('returns relative Unix path for an absolute path within git root', () => {
    const path = '/Users/user/Projects/myProject/src/index.js';
    const gitRoot = '/Users/user/Projects/myProject';
    const output = formatGitPath(path, gitRoot);
    expect(output).toBe('src/index.js');
  });

  it('returns relative Unix path for a relative path within current working directory', () => {
    // Mocking process.cwd() to return a specific path
    vi.spyOn(process, 'cwd').mockReturnValue('/Users/user/Projects/myProject');
    const path = 'src/index.js';
    const gitRoot = '/Users/user/Projects/myProject';
    const output = formatGitPath(path, gitRoot);
    expect(output).toBe('src/index.js');
  });

  it('handles paths outside of git root correctly', () => {
    const path = '/Users/user/AnotherProject/test.js';
    const gitRoot = '/Users/user/Projects/myProject';
    const output = formatGitPath(path, gitRoot);
    expect(output).toBe('../../AnotherProject/test.js');
  });

  it('converts non-relative absolute paths to relative paths', () => {
    const path = '/Users/user/Projects/myProject/utils/script.js';
    const gitRoot = '/Users/user/Projects/myProject';
    const output = formatGitPath(path, gitRoot);
    expect(output).toBe('utils/script.js');
  });
});
