import { expect } from 'vitest';
import { CommitData, getLatestCommit } from './git';

const gitCommitDateRegex =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2} \d{2}:\d{2}:\d{2} \d{4} [+|-]\d{4}$/;

describe('git', () => {
  it('should log latest commit', async () => {
    const commit: CommitData | null = await getLatestCommit();
    expect(commit).not.toBeNull();
    expect(commit).toHaveProperty('hash');
    expect(commit?.hash).toHaveLength(40);
    expect(commit?.hash).toMatch(/^[0-9a-f]+$/);
    expect(commit).toHaveProperty('message');
    expect(commit?.message).not.toHaveLength(0);
    expect(commit).toHaveProperty('author');
    expect(commit?.author).not.toHaveLength(0);
    expect(commit).toHaveProperty('date');
    expect(commit?.date).toMatch(gitCommitDateRegex);
  });
});
