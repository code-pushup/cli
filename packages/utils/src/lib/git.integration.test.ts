import { expect } from 'vitest';
import { getLatestCommit } from './git';

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
