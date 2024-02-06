import { describe, expect, it } from 'vitest';
import { LIGHTHOUSE_URL } from '../mock/constants';
import { create } from './lighthouse.plugin';
import { getLighthouseCliArguments } from './utils';

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
      url: LIGHTHOUSE_URL,
      headless: 'new',
    });
    expect(args).toEqual(
      expect.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should not include options for headless if false is given', () => {
    const args = getLighthouseCliArguments({
      url: LIGHTHOUSE_URL,
      headless: false,
    });
    expect(args).toEqual(
      expect.not.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should use userDataDir option in chrome flags when given', () => {
    const args = getLighthouseCliArguments({
      url: LIGHTHOUSE_URL,
      userDataDir: 'test',
    });
    expect(args).toEqual(
      expect.arrayContaining(['--chrome-flags="--user-data-dir=test"']),
    );
  });
});
