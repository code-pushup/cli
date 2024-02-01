import { expect } from 'vitest';
import { getLighthouseCliArguments } from './utils';

describe('getLighthouseCliArguments', () => {
  it('should parse valid options', () => {
    expect(
      getLighthouseCliArguments({
        url: 'https://code-pushup-portal.com',
      }),
    ).toEqual(expect.arrayContaining(['https://code-pushup-portal.com']));
  });

  it('should parse options for headless to "new" if true is given', () => {
    const args = getLighthouseCliArguments({
      url: 'https://code-pushup-portal.com',
      headless: 'new',
    });
    expect(args).toEqual(
      expect.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should not contain options for headless if "false" is given', () => {
    const args = getLighthouseCliArguments({
      url: 'https://code-pushup-portal.com',
      headless: false,
    });
    expect(args).toEqual(
      expect.not.arrayContaining([expect.stringContaining('headless')]),
    );
  });

  it('should parse options for userDataDir correctly', () => {
    const args = getLighthouseCliArguments({
      url: 'https://code-pushup-portal.com',
      userDataDir: 'test',
    });
    expect(args).toEqual(
      expect.arrayContaining(['--chrome-flags="--user-data-dir=test"']),
    );
  });

  it('should parse multiple chrome-flags options correctly', () => {
    const args = getLighthouseCliArguments({
      url: 'https://code-pushup-portal.com',
      headless: 'new',
      userDataDir: 'test',
    });
    expect(args).toEqual(
      expect.arrayContaining([
        '--chrome-flags="--headless=new --user-data-dir=test"',
      ]),
    );
  });
});
