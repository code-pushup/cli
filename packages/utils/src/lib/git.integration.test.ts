import { expect } from 'vitest';
import { makeStatusClean, makeStatusDirty } from '@code-pushup/testing-utils';
import {
  branchHasChanges,
  getCurrentBranchOrTag,
  getLatestCommit,
  guardAgainstDirtyRepo,
  safeCheckout,
} from './git';

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
  it('should return true if some changes are given', async () => {
    await makeStatusDirty();
    await expect(branchHasChanges()).resolves.toBe(true);
    await makeStatusClean();
  });
  it('should return false if no changes are given', async () => {
    await expect(branchHasChanges()).resolves.toBe(false);
  });
});

describe('guardAgainstDirtyRepo', () => {
  it('should throw if history is dirty', async () => {
    await makeStatusDirty();
    await expect(guardAgainstDirtyRepo()).rejects.toThrow(
      'Repository should be clean before we you can proceed',
    );
    await makeStatusClean();
  });
  it('should not throw if history is clean', async () => {
    await expect(guardAgainstDirtyRepo()).resolves.toEqual(void 0);
  });
});

describe('getCurrentBranchOrTag', () => {
  it('should log current branch', async () => {
    await expect(getCurrentBranchOrTag()).resolves.toEqual(expect.any(String));
  });
});
describe('safeCheckout', () => {
  it('should checkout target branch in clean state', async () => {
    await expect(safeCheckout('main')).resolves.toBe(void 0);
    expect(getCurrentBranchOrTag()).toBe('main');
  });
});
