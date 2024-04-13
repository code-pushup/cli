import {simpleGit, SimpleGit, StatusResult} from 'simple-git';
import {afterAll, beforeAll, describe, expect, vi} from 'vitest';
import {getHashes, GitStatusError, guardAgainstLocalChanges} from './git';
import {join} from "node:path";
import {mkdir, rm, writeFile} from "node:fs/promises";

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
