import { describe, expect, it } from 'vitest';
import { Group, PluginConfig, RunnerConfig } from '@code-pushup/models';
import { jsPackagesPlugin } from './js-packages-plugin';

vi.mock('./runner/index.ts', () => ({
  createRunnerConfig: vi.fn().mockReturnValue({
    command: 'node',
    outputFile: 'runner-output.json',
  } satisfies RunnerConfig),
}));

describe('jsPackagesPlugin', () => {
  it('should initialise a JS packages plugin', async () => {
    await expect(
      jsPackagesPlugin({ packageManager: 'npm', features: ['outdated'] }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        slug: 'js-packages',
        title: 'Plugin for JS packages',
        audits: expect.any(Array),
        groups: expect.any(Array),
        runner: expect.any(Object),
      }),
    );
  });

  it('should set package manager and commands based on configuration', async () => {
    await expect(
      jsPackagesPlugin({ packageManager: 'yarn', features: ['audit'] }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        audits: [expect.objectContaining({ slug: 'yarn-audit' })],
        groups: [
          expect.objectContaining<Partial<Group>>({
            slug: 'yarn-package-manager',
            refs: [{ slug: 'yarn-audit', weight: 1 }],
          }),
        ],
      }),
    );
  });

  it('should use npm with both audit and outdated commands when no configuration is provided', async () => {
    await expect(jsPackagesPlugin()).resolves.toStrictEqual(
      expect.objectContaining<Partial<PluginConfig>>({
        audits: [
          expect.objectContaining({ slug: 'npm-audit' }),
          expect.objectContaining({ slug: 'npm-outdated' }),
        ],
        groups: [
          expect.objectContaining<Partial<Group>>({
            slug: 'npm-package-manager',
            refs: [
              { slug: 'npm-audit', weight: 1 },
              { slug: 'npm-outdated', weight: 1 },
            ],
          }),
        ],
      }),
    );
  });

  it('should use an icon that matches the chosen package manager', async () => {
    await expect(
      jsPackagesPlugin({ packageManager: 'pnpm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining<Partial<PluginConfig>>({
        icon: 'pnpm',
      }),
    );
  });
});
