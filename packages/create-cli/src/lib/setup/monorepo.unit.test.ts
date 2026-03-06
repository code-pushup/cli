import { select } from '@inquirer/prompts';
import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { addCodePushUpCommand, promptSetupMode } from './monorepo.js';
import type { WizardProject } from './types.js';
import { createTree } from './virtual-fs.js';

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

describe('promptSetupMode', () => {
  it('should return CLI arg when --mode is provided', async () => {
    await expect(promptSetupMode('nx', { mode: 'standalone' })).resolves.toBe(
      'standalone',
    );
    expect(select).not.toHaveBeenCalled();
  });

  it('should auto-select monorepo when --yes and tool detected', async () => {
    await expect(promptSetupMode('nx', { yes: true })).resolves.toBe(
      'monorepo',
    );
    expect(select).not.toHaveBeenCalled();
  });

  it('should auto-select standalone when --yes and no tool', async () => {
    await expect(promptSetupMode(null, { yes: true })).resolves.toBe(
      'standalone',
    );
  });

  it('should prompt interactively with monorepo pre-selected when tool detected', async () => {
    vi.mocked(select).mockResolvedValue('monorepo');

    await promptSetupMode('pnpm', {});

    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ default: 'monorepo' }),
    );
  });

  it('should prompt interactively with standalone pre-selected when no tool detected', async () => {
    vi.mocked(select).mockResolvedValue('standalone');

    await promptSetupMode(null, {});

    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ default: 'standalone' }),
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
