import { latestHash } from './git';
import { expect } from 'vitest';

describe('git', () => {
  it('should log current hash', async () => {
    const hash = await latestHash();
    expect(hash.length).toBeGreaterThan(0);
  });
});
