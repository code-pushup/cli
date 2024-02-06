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

  it('should parse options for headless to new if true is given', async () => {
    const pluginConfig = await create({
      url: LIGHTHOUSE_URL,
      headless: true,
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should parse options for headless to new if false is given', async () => {
    const pluginConfig = await create({
      url: LIGHTHOUSE_URL,
      headless: false,
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.not.arrayContaining(['--chrome-flags="--headless=new"']),
    );
  });

  it('should parse options for userDataDir correctly', async () => {
    const pluginConfig = await create({
      url: LIGHTHOUSE_URL,
      userDataDir: 'test',
    });
    expect(pluginConfig.runner.args).toEqual(
      expect.arrayContaining([
        '--chrome-flags="--headless=new --user-data-dir=test"',
      ]),
    );
  });
});
