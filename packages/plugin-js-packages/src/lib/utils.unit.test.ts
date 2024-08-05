import { describe, expect, it } from 'vitest';
import { normalizeConfig } from './utils';

describe('normalizeConfig', () => {
  it('should return checks object', async () => {
    await expect(
      normalizeConfig({ packageManager: 'npm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        checks: ['audit', 'outdated'],
      }),
    );
  });

  it('should return depGroups object', async () => {
    await expect(
      normalizeConfig({ packageManager: 'npm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        depGroups: ['prod', 'dev'],
      }),
    );
  });

  it('should throw if no package manager is detected', async () => {
    await expect(normalizeConfig()).rejects.toThrow(
      'Could not detect package manager. Please provide it in the js-packages plugin config.',
    );
  });

  it('should return npm packageManager object if packageManager name is npm', async () => {
    await expect(
      normalizeConfig({ packageManager: 'npm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        packageManager: expect.objectContaining({
          slug: 'npm',
          command: 'npm',
          name: 'NPM',
        }),
      }),
    );
  });

  it('should return yarn-classic packageManager object if packageManager name is yarn-classic', async () => {
    await expect(
      normalizeConfig({ packageManager: 'yarn-classic' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        packageManager: expect.objectContaining({
          slug: 'yarn-classic',
          command: 'yarn',
          name: 'Yarn v1',
        }),
      }),
    );
  });

  it('should return yarn-modern packageManager object if packageManager name is yarn-modern', async () => {
    await expect(
      normalizeConfig({ packageManager: 'yarn-modern' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        packageManager: expect.objectContaining({
          slug: 'yarn-modern',
          command: 'yarn',
          name: 'yarn-modern',
        }),
      }),
    );
  });

  it('should return pnpm packageManager object if packageManager name is pnpm', async () => {
    await expect(
      normalizeConfig({ packageManager: 'pnpm' }),
    ).resolves.toStrictEqual(
      expect.objectContaining({
        packageManager: expect.objectContaining({
          slug: 'pnpm',
          command: 'pnpm',
          name: 'pnpm',
        }),
      }),
    );
  });
});
