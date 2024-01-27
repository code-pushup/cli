import { expect } from 'vitest';
import {branchHasChanges, getLatestCommit, guardAgainstDirtyRepo} from './git';
import {makeStatusClean, makeStatusDirty} from "@code-pushup/testing-utils";

const gitCommitDateRegex =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2} \d{2}:\d{2}:\d{2} \d{4} [+|-]\d{4}$/;

describe('getLatestCommit', () => {
  it('should log latest commit', async () => {
    await expect(getLatestCommit()).resolves.toEqual(
      expect.objectContaining({
        hash: expect.stringMatching(/^[\da-f]{40}$/),
        message: expect.stringMatching(/.+/),
        author: expect.stringMatching(/.+/),
        date: expect.stringMatching(gitCommitDateRegex),
      }),
    );
  });
});

describe('branchHasChanges', () => {
  it('should log changes if some are given', async () => {
    await makeStatusDirty();
    await expect(branchHasChanges()).resolves.toEqual(true);
    await makeStatusClean();
  });
  it('should log no changes if non are given', async () => {
    await expect(branchHasChanges()).resolves.toEqual(false);
  });
});

describe('guardAgainstDirtyRepo', () => {
  it('should throw if history is dirty', async () => {
    await makeStatusDirty();
    await expect(guardAgainstDirtyRepo()).rejects.toThrow('Repository should be clean before we you can proceed');
    await makeStatusClean();
  });
  it('should not throw if history is clean', async () => {
    await expect(guardAgainstDirtyRepo()).resolves.toEqual(void 0);
  });
});
