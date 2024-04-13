import { SimpleGit, StatusResult } from 'simple-git';
import { describe, expect } from 'vitest';
import { GitStatusError, guardAgainstLocalChanges } from './git';

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
