import {describe, it, expect, beforeAll} from 'vitest';
import {cli} from '@quality-metrics/cli';
import {execSync} from 'child_process';
import {join} from "path";

const configFile = (ext: 'ts' | 'js' | 'mjs') => join(process.cwd(),`examples/cli-e2e/mocks/config.mock.${ext}`);

describe('cli', () => {
  beforeAll(() => {
    // symlink NPM workspaces
    execSync('npm install');
  });

  it('should load .js config file', async () => {
    const argv = await cli(['--configPath', configFile('js'), '--verbose']).argv;
    expect(argv.plugins[0].meta.slug).toEqual('eslint');
    expect(argv.plugins[1].meta.slug).toEqual('lighthouse');
  });

  it('should load .mjs config file', async () => {
    const argv = await cli(['--configPath', configFile('mjs'), '--verbose']).argv;
    expect(argv.plugins[0].meta.slug).toEqual('eslint');
    expect(argv.plugins[1].meta.slug).toEqual('lighthouse');
  });

  it('should load .ts config file', async () => {
    const argv = await cli(['--configPath', configFile('ts'), '--verbose']).argv;
    expect(argv.plugins[0].meta.slug).toEqual('eslint');
    expect(argv.plugins[1].meta.slug).toEqual('lighthouse');
  });
})
