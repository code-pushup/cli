import { generateRandomId } from './random.js';

describe('generateRandomId', () => {
  it('should generate different IDs', () => {
    expect(generateRandomId()).not.toEqual(generateRandomId());
  });

  it('should generate integer string', () => {
    expect(generateRandomId()).toMatch(/^\d+$/);
  });
});
