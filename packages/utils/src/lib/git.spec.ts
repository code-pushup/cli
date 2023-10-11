import { latestHash } from './git';
import { expect } from 'vitest';

describe('git', () => {
  it('should log current hash', async () => {
    const hash = await latestHash();
    expect(hash).toHaveLength(40);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});
