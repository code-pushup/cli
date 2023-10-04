import { cli } from '@code-pushup/cli';
import eslintPlugin from '@code-pushup/eslint-plugin';
import lighthousePlugin from '@code-pushup/lighthouse-plugin';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { execSync } from 'child_process';

const configFile = (ext: 'ts' | 'js' | 'mjs') =>
  join(process.cwd(), `examples/cli-e2e/mocks/code-pushup.config.${ext}`);

const execCli = async (args: string[]) => {
  await execSync('npx ./dist/packages/cli ' + args.join(' '));
};
describe('cli', () => {
  it('should load .js config file', async () => {
    const argv = await execCli(['--configPath', configFile('js'), '--verbose']);
  });

  it('should load .mjs config file', async () => {
    const argv = await execCli([
      '--configPath',
      configFile('mjs'),
      '--verbose',
    ]);
    expect(argv.plugins[0]).toEqual(eslintPlugin({ config: '.eslintrc.json' }));
    expect(argv.plugins[1]).toEqual(
      lighthousePlugin({ config: '.lighthouserc.json' }),
    );
  });

  it('should load .ts config file', async () => {
    const argv = await execCli(['--configPath', configFile('ts'), '--verbose']);
    expect(argv.plugins[0]).toEqual(eslintPlugin({ config: '.eslintrc.json' }));
    expect(argv.plugins[1]).toEqual(
      lighthousePlugin({ config: '.lighthouserc.json' }),
    );
  });
});
