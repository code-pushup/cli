import { execSync } from 'child_process';
import { join } from 'path';
import { describe, it } from 'vitest';

const configFile = (ext: 'ts' | 'js' | 'mjs') =>
  join(process.cwd(), `examples/cli-e2e/mocks/code-pushup.config.${ext}`);

const execCli = (args: string[]) => {
  execSync('node ./dist/packages/cli ' + args.join(' '));
};

describe('cli', () => {
  it('should load .js config file', () => {
    execCli(['--configPath', configFile('js'), '--verbose']);
  });

  it('should load .mjs config file', () => {
    execCli(['--configPath', configFile('mjs'), '--verbose']);
  });

  it('should load .ts config file', () => {
    execCli(['--configPath', configFile('ts'), '--verbose']);
  });
});
