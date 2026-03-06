import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { detectMonorepoTool } from './monorepo.js';

describe('detectMonorepoTool', () => {
  it('should detect Nx by nx.json', async () => {
    vol.fromJSON({ 'nx.json': '{}' }, MEMFS_VOLUME);
    await expect(detectMonorepoTool(MEMFS_VOLUME)).resolves.toBe('nx');
  });

  it('should detect Turborepo by turbo.json', async () => {
    vol.fromJSON({ 'turbo.json': '{}' }, MEMFS_VOLUME);
    await expect(detectMonorepoTool(MEMFS_VOLUME)).resolves.toBe('turbo');
  });

  it('should detect Yarn workspaces by yarn.lock + workspaces config', async () => {
    vol.fromJSON(
      {
        'yarn.lock': '',
        'package.json': JSON.stringify({
          private: true,
          workspaces: ['packages/*'],
        }),
      },
      MEMFS_VOLUME,
    );
    await expect(detectMonorepoTool(MEMFS_VOLUME)).resolves.toBe('yarn');
  });

  it('should detect pnpm by pnpm-workspace.yaml', async () => {
    vol.fromJSON(
      { 'pnpm-workspace.yaml': 'packages:\n  - packages/*' },
      MEMFS_VOLUME,
    );
    await expect(detectMonorepoTool(MEMFS_VOLUME)).resolves.toBe('pnpm');
  });

  it('should detect npm workspaces by package-lock.json + workspaces config', async () => {
    vol.fromJSON(
      {
        'package-lock.json': '{}',
        'package.json': JSON.stringify({
          private: true,
          workspaces: ['packages/*'],
        }),
      },
      MEMFS_VOLUME,
    );
    await expect(detectMonorepoTool(MEMFS_VOLUME)).resolves.toBe('npm');
  });

  it('should return null when no monorepo tool detected', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
    await expect(detectMonorepoTool(MEMFS_VOLUME)).resolves.toBeNull();
  });

  it('should prioritize Nx over other tools', async () => {
    vol.fromJSON(
      {
        'nx.json': '{}',
        'pnpm-workspace.yaml': 'packages:\n  - packages/*',
      },
      MEMFS_VOLUME,
    );
    await expect(detectMonorepoTool(MEMFS_VOLUME)).resolves.toBe('nx');
  });

  it('should not detect yarn without workspaces enabled', async () => {
    vol.fromJSON(
      {
        'yarn.lock': '',
        'package.json': JSON.stringify({ name: 'my-app' }),
      },
      MEMFS_VOLUME,
    );
    await expect(detectMonorepoTool(MEMFS_VOLUME)).resolves.toBeNull();
  });
});
