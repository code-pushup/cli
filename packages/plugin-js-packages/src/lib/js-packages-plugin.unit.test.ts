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
      jsPackagesPlugin({ packageManager: 'npm', checks: ['outdated'] }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        slug: 'js-packages',
        title: 'JS Packages',
        audits: expect.any(Array),
        groups: expect.any(Array),
        runner: expect.any(Object),
      }),
    );
  });

  it('should create a group for both audit and outdated when no check configuration is provided', async () => {
    await expect(
      jsPackagesPlugin({ packageManager: 'npm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining<Partial<PluginConfig>>({
        groups: [
          expect.objectContaining<Partial<Group>>({
            slug: 'npm-audit',
          }),
          expect.objectContaining<Partial<Group>>({
            slug: 'npm-outdated',
          }),
        ],
      }),
    );
  });

  it('should configure a group based on package manager and chosen check', async () => {
    await expect(
      jsPackagesPlugin({ packageManager: 'yarn-modern', checks: ['outdated'] }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        groups: [
          expect.objectContaining<Partial<Group>>({
            slug: 'yarn-modern-outdated',
          }),
        ],
      }),
    );
  });

  it('should create an audit for default dependency groups', async () => {
    await expect(
      jsPackagesPlugin({
        packageManager: 'yarn-classic',
        checks: ['audit'],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        audits: [
          expect.objectContaining({ slug: 'yarn-classic-audit-prod' }),
          expect.objectContaining({ slug: 'yarn-classic-audit-dev' }),
        ],
        groups: [
          expect.objectContaining<Partial<Group>>({
            slug: 'yarn-classic-audit',
            refs: [
              { slug: 'yarn-classic-audit-prod', weight: 80 },
              { slug: 'yarn-classic-audit-dev', weight: 15 },
            ],
          }),
        ],
      }),
    );
  });

  it('should create an audit for selected dependency groups', async () => {
    await expect(
      jsPackagesPlugin({
        packageManager: 'yarn-classic',
        checks: ['audit'],
        dependencyGroups: ['prod', 'optional'],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        audits: [
          expect.objectContaining({ slug: 'yarn-classic-audit-prod' }),
          expect.objectContaining({ slug: 'yarn-classic-audit-optional' }),
        ],
        groups: [
          expect.objectContaining<Partial<Group>>({
            slug: 'yarn-classic-audit',
            refs: [
              { slug: 'yarn-classic-audit-prod', weight: 80 },
              { slug: 'yarn-classic-audit-optional', weight: 5 },
            ],
          }),
        ],
      }),
    );
  });

  // Note: Yarn v2 does not support audit for optional dependencies
  it('should omit unsupported dependency groups', async () => {
    await expect(
      jsPackagesPlugin({
        packageManager: 'yarn-modern',
        checks: ['audit'],
        dependencyGroups: ['prod', 'optional'],
      }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        audits: [expect.objectContaining({ slug: 'yarn-modern-audit-prod' })],
        groups: [
          expect.objectContaining<Partial<Group>>({
            slug: 'yarn-modern-audit',
            refs: [{ slug: 'yarn-modern-audit-prod', weight: 80 }],
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
