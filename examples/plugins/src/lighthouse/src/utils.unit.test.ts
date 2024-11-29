import { describe, expect, it } from 'vitest';
import { getLighthouseCliArguments } from './utils.js';

describe('getLighthouseCliArguments', () => {
  it('should parse valid options', () => {
    expect(
      getLighthouseCliArguments({
        url: 'https://code-pushup-portal.com',
      }),
    ).toEqual(expect.arrayContaining(['https://code-pushup-portal.com']));
  });

  it('should parse options for headless to new if true is given', () => {
    const args = getLighthouseCliArguments({
      url: 'http://localhost:8080',
      headless: 'new',
    });
    expect(args).toEqual(
      expect.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should not include options for headless if false is given', () => {
    const args = getLighthouseCliArguments({
      url: 'http://localhost:8080',
      headless: false,
    });
    expect(args).toEqual(
      expect.not.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should use userDataDir option in chrome flags when given', () => {
    const args = getLighthouseCliArguments({
      url: 'http://localhost:8080',
      userDataDir: 'test',
    });
    expect(args).toEqual(
      expect.arrayContaining(['--chrome-flags="--user-data-dir=test"']),
    );
  });
});
