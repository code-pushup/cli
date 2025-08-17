import { type Commit, commitSchema } from './commit.js';

describe('commitSchema', () => {
  it('should accept valid git commit data', () => {
    expect(() =>
      commitSchema.parse({
        hash: 'abcdef0123456789abcdef0123456789abcdef01',
        message: 'Minor fixes',
        author: 'John Doe',
        date: new Date(),
      } satisfies Commit),
    ).not.toThrow();
  });

  it('should coerce date string into Date object', () => {
    expect(
      commitSchema.parse({
        hash: 'abcdef0123456789abcdef0123456789abcdef01',
        message: 'Minor fixes',
        author: 'John Doe',
        date: '2024-03-06T17:30:12+01:00',
      }),
    ).toEqual<Commit>({
      hash: 'abcdef0123456789abcdef0123456789abcdef01',
      message: 'Minor fixes',
      author: 'John Doe',
      date: new Date('2024-03-06T17:30:12+01:00'),
    });
  });

  it('should throw for invalid hash', () => {
    expect(() =>
      commitSchema.parse({
        hash: '12345678', // too short
        message: 'Minor fixes',
        author: 'John Doe',
        date: new Date(),
      } satisfies Commit),
    ).toThrow('Commit SHA should be a 40-character hexadecimal string');
  });
});
