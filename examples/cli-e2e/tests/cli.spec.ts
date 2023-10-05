import { cli } from '@quality-metrics/cli';
import eslintPlugin from '@quality-metrics/eslint-plugin';
import lighthousePlugin from '@quality-metrics/lighthouse-plugin';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const configFile = (ext: 'ts' | 'js' | 'mjs') =>
  join(process.cwd(), `examples/cli-e2e/mocks/config.mock.${ext}`);

describe('cli', () => {
  it('should load .js config file', async () => {
    const argv = await cli(['--configPath', configFile('js'), '--verbose'])
      .argv;
    expect(argv.plugins[0]).toEqual(
      await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
    );
    expect(argv.plugins[1]).toEqual(
      lighthousePlugin({ config: '.lighthouserc.json' }),
    );
  });

  it('should load .mjs config file', async () => {
    const argv = await cli(['--configPath', configFile('mjs'), '--verbose'])
      .argv;
    expect(argv.plugins[0]).toEqual(
      await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
    );
    expect(argv.plugins[1]).toEqual(
      lighthousePlugin({ config: '.lighthouserc.json' }),
    );
  });

  it('should load .ts config file', async () => {
    const argv = await cli(['--configPath', configFile('ts'), '--verbose'])
      .argv;
    expect(argv.plugins[0]).toEqual(
      await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
    );
    expect(argv.plugins[1]).toEqual(
      lighthousePlugin({ config: '.lighthouserc.json' }),
    );
  });
});
