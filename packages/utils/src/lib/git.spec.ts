import { expect } from 'vitest';
import { latestHash } from './git';

describe('git', () => {
  it('should log current hash', async () => {
    const hash = await latestHash();
    expect(hash).toHaveLength(40);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});
