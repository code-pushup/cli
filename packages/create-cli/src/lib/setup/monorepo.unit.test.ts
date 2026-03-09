import { select } from '@inquirer/prompts';
import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { logger } from '@code-pushup/utils';
import { addCodePushUpCommand, promptSetupMode } from './monorepo.js';
import type { WizardProject } from './types.js';
import { createTree } from './virtual-fs.js';

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

describe('promptSetupMode', () => {
  it('should skip detection when --mode standalone is provided', async () => {
    await expect(
      promptSetupMode(MEMFS_VOLUME, { mode: 'standalone' }),
    ).resolves.toStrictEqual({ mode: 'standalone', tool: null });
    expect(select).not.toHaveBeenCalled();
  });

  it('should detect tool when --mode monorepo is provided', async () => {
    vol.fromJSON(
      { 'pnpm-workspace.yaml': 'packages:\n  - packages/*' },
      MEMFS_VOLUME,
    );

    await expect(
      promptSetupMode(MEMFS_VOLUME, { mode: 'monorepo' }),
    ).resolves.toStrictEqual({ mode: 'monorepo', tool: 'pnpm' });
    expect(select).not.toHaveBeenCalled();
  });

  it('should fall back to standalone with warning when --mode monorepo but no tool detected', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);

    await expect(
      promptSetupMode(MEMFS_VOLUME, { mode: 'monorepo' }),
    ).resolves.toStrictEqual({ mode: 'standalone', tool: null });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('falling back to standalone'),
    );
  });

  it('should auto-select monorepo when --yes and tool detected', async () => {
    vol.fromJSON(
      { 'pnpm-workspace.yaml': 'packages:\n  - packages/*' },
      MEMFS_VOLUME,
    );

    await expect(
      promptSetupMode(MEMFS_VOLUME, { yes: true }),
    ).resolves.toStrictEqual({ mode: 'monorepo', tool: 'pnpm' });
    expect(select).not.toHaveBeenCalled();
  });

  it('should auto-select standalone when --yes and no tool', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);

    await expect(
      promptSetupMode(MEMFS_VOLUME, { yes: true }),
    ).resolves.toStrictEqual({ mode: 'standalone', tool: null });
  });

  it('should prompt interactively with monorepo pre-selected when tool detected', async () => {
    vol.fromJSON(
      { 'pnpm-workspace.yaml': 'packages:\n  - packages/*' },
      MEMFS_VOLUME,
    );
    vi.mocked(select).mockResolvedValue('monorepo');

    await promptSetupMode(MEMFS_VOLUME, {});

    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ default: 'monorepo' }),
    );
  });

  it('should prompt interactively with standalone pre-selected when no tool', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
    vi.mocked(select).mockResolvedValue('standalone');

    await promptSetupMode(MEMFS_VOLUME, {});

    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ default: 'standalone' }),
    );
  });

  it('should fall back to standalone with warning when user selects monorepo but no tool detected', async () => {
    vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
    vi.mocked(select).mockResolvedValue('monorepo');

    await expect(promptSetupMode(MEMFS_VOLUME, {})).resolves.toStrictEqual({
      mode: 'standalone',
      tool: null,
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('falling back to standalone'),
    );
  });
});

describe('addCodePushUpCommand', () => {
  const PROJECT: WizardProject = {
    name: 'my-app',
    directory: `${MEMFS_VOLUME}/packages/my-app`,
    relativeDir: 'packages/my-app',
  };

  it('should add Nx target when project.json exists', async () => {
    vol.fromJSON(
      {
        'packages/my-app/project.json': JSON.stringify({
          name: 'my-app',
          targets: {},
        }),
      },
      MEMFS_VOLUME,
    );
    const tree = createTree(MEMFS_VOLUME);

    await addCodePushUpCommand(tree, PROJECT, 'nx');

    expect(tree.listChanges()).toPartiallyContain({
      path: 'packages/my-app/project.json',
      content: `${JSON.stringify(
        {
          name: 'my-app',
          targets: {
            'code-pushup': {
              executor: 'nx:run-commands',
              options: { command: 'npx code-pushup' },
            },
          },
        },
        null,
        2,
      )}\n`,
    });
  });

  it('should add package.json script for non-Nx tools', async () => {
    vol.fromJSON(
      {
        'packages/my-app/package.json': JSON.stringify({
          name: 'my-app',
          scripts: { test: 'vitest' },
        }),
      },
      MEMFS_VOLUME,
    );
    const tree = createTree(MEMFS_VOLUME);

    await addCodePushUpCommand(tree, PROJECT, 'pnpm');

    expect(tree.listChanges()).toPartiallyContain({
      path: 'packages/my-app/package.json',
      content: `${JSON.stringify(
        {
          name: 'my-app',
          scripts: { test: 'vitest', 'code-pushup': 'code-pushup' },
        },
        null,
        2,
      )}\n`,
    });
  });

  it('should fall back to package.json when Nx project has no project.json', async () => {
    vol.fromJSON(
      {
        'packages/my-app/package.json': JSON.stringify({
          name: 'my-app',
          scripts: {},
        }),
      },
      MEMFS_VOLUME,
    );
    const tree = createTree(MEMFS_VOLUME);

    await addCodePushUpCommand(tree, PROJECT, 'nx');

    expect(tree.listChanges()).toPartiallyContain({
      path: 'packages/my-app/package.json',
    });
    expect(tree.listChanges()).not.toPartiallyContain({
      path: 'packages/my-app/project.json',
    });
  });

  it('should not overwrite existing code-pushup target', async () => {
    vol.fromJSON(
      {
        'packages/my-app/project.json': JSON.stringify({
          name: 'my-app',
          targets: {
            'code-pushup': { executor: 'custom:executor' },
          },
        }),
      },
      MEMFS_VOLUME,
    );
    const tree = createTree(MEMFS_VOLUME);

    await addCodePushUpCommand(tree, PROJECT, 'nx');

    expect(tree.listChanges()).toBeEmpty();
  });

  it('should not overwrite existing code-pushup script', async () => {
    vol.fromJSON(
      {
        'packages/my-app/package.json': JSON.stringify({
          name: 'my-app',
          scripts: { 'code-pushup': 'custom-command' },
        }),
      },
      MEMFS_VOLUME,
    );
    const tree = createTree(MEMFS_VOLUME);

    await addCodePushUpCommand(tree, PROJECT, 'pnpm');

    expect(tree.listChanges()).toBeEmpty();
  });
});
