import { expect } from 'vitest';
import { CommitData, getLatestCommit } from './git';

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
    expect(commit?.date).not.toHaveLength(0);
  });
});
