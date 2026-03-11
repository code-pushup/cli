import { select } from '@inquirer/prompts';
import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { promptCiProvider, resolveCi } from './ci.js';
import type { ConfigContext } from './types.js';
import { createTree } from './virtual-fs.js';

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

vi.mock('@code-pushup/utils', async importOriginal => ({
  ...(await importOriginal<typeof import('@code-pushup/utils')>()),
  getGitDefaultBranch: vi.fn().mockResolvedValue('main'),
}));

describe('promptCiProvider', () => {
  it.each(['github', 'gitlab', 'none'] as const)(
    'should return %j when --ci %s is provided',
    async ci => {
      await expect(promptCiProvider({ ci })).resolves.toBe(ci);
      expect(select).not.toHaveBeenCalled();
    },
  );

  it('should return "none" when --yes is provided', async () => {
    await expect(promptCiProvider({ yes: true })).resolves.toBe('none');
    expect(select).not.toHaveBeenCalled();
  });

  it('should prompt interactively when no CLI arg or --yes', async () => {
    vi.mocked(select).mockResolvedValue('github');

    await expect(promptCiProvider({})).resolves.toBe('github');
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'CI/CD integration:',
        default: 'none',
      }),
    );
  });
});

describe('resolveCi', () => {
  const STANDALONE_CONTEXT: ConfigContext = { mode: 'standalone', tool: null };

  describe('GitHub Actions', () => {
    it('should create workflow without monorepo input in standalone mode', async () => {
      vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
      const tree = createTree(MEMFS_VOLUME);

      await resolveCi(tree, 'github', STANDALONE_CONTEXT);
      await expect(tree.read('.github/workflows/code-pushup.yml')).resolves
        .toMatchInlineSnapshot(`
        "name: Code PushUp

        on:
          push:
            branches: [main]
          pull_request:
            branches: [main]

        permissions:
          contents: read
          actions: read
          pull-requests: write

        jobs:
          code-pushup:
            runs-on: ubuntu-latest
            name: Code PushUp
            steps:
              - name: Clone repository
                uses: actions/checkout@v5
              - name: Set up Node.js
                uses: actions/setup-node@v6
              - name: Install dependencies
                run: npm ci
              - name: Code PushUp
                uses: code-pushup/github-action@v0
        "
      `);
    });

    it('should create workflow with monorepo input when in monorepo mode', async () => {
      vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
      const tree = createTree(MEMFS_VOLUME);

      await resolveCi(tree, 'github', { mode: 'monorepo', tool: 'nx' });
      await expect(tree.read('.github/workflows/code-pushup.yml')).resolves
        .toMatchInlineSnapshot(`
        "name: Code PushUp

        on:
          push:
            branches: [main]
          pull_request:
            branches: [main]

        permissions:
          contents: read
          actions: read
          pull-requests: write

        jobs:
          code-pushup:
            runs-on: ubuntu-latest
            name: Code PushUp
            steps:
              - name: Clone repository
                uses: actions/checkout@v5
              - name: Set up Node.js
                uses: actions/setup-node@v6
              - name: Install dependencies
                run: npm ci
              - name: Code PushUp
                uses: code-pushup/github-action@v0
                with:
                  monorepo: nx
        "
      `);
    });
  });

  describe('GitLab CI/CD', () => {
    it('should create .gitlab-ci.yml when no file exists', async () => {
      vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
      const tree = createTree(MEMFS_VOLUME);

      await resolveCi(tree, 'gitlab', STANDALONE_CONTEXT);

      expect(tree.listChanges()).toPartiallyContain({
        path: '.gitlab-ci.yml',
        type: 'CREATE',
      });
      await expect(tree.read('.gitlab-ci.yml')).resolves.toMatchInlineSnapshot(`
        "workflow:
          rules:
            - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
            - if: $CI_PIPELINE_SOURCE == 'merge_request_event'

        include:
          - https://gitlab.com/code-pushup/gitlab-pipelines-template/-/raw/latest/code-pushup.yml
        "
      `);
    });

    it('should append local include when .gitlab-ci.yml has include array', async () => {
      vol.fromJSON(
        {
          'package.json': '{}',
          '.gitlab-ci.yml': 'include:\n  - local: .gitlab/ci/version.yml\n',
        },
        MEMFS_VOLUME,
      );
      const tree = createTree(MEMFS_VOLUME);

      await resolveCi(tree, 'gitlab', STANDALONE_CONTEXT);

      await expect(tree.read('.gitlab-ci.yml')).resolves.toMatchInlineSnapshot(`
        "include:
          - local: .gitlab/ci/version.yml
          - local: .gitlab/ci/code-pushup.gitlab-ci.yml
        "
      `);
    });

    it('should wrap single include object into array and append', async () => {
      vol.fromJSON(
        {
          'package.json': '{}',
          '.gitlab-ci.yml': 'include:\n  local: .gitlab/ci/version.yml\n',
        },
        MEMFS_VOLUME,
      );
      const tree = createTree(MEMFS_VOLUME);

      await resolveCi(tree, 'gitlab', STANDALONE_CONTEXT);

      await expect(tree.read('.gitlab-ci.yml')).resolves.toMatchInlineSnapshot(`
        "include:
          - local: .gitlab/ci/version.yml
          - local: .gitlab/ci/code-pushup.gitlab-ci.yml
        "
      `);
    });

    it('should create include array when .gitlab-ci.yml has no include key', async () => {
      vol.fromJSON(
        {
          'package.json': '{}',
          '.gitlab-ci.yml': 'stages:\n  - test\n',
        },
        MEMFS_VOLUME,
      );
      const tree = createTree(MEMFS_VOLUME);

      await resolveCi(tree, 'gitlab', STANDALONE_CONTEXT);

      await expect(tree.read('.gitlab-ci.yml')).resolves.toMatchInlineSnapshot(`
        "stages:
          - test
        include:
          - local: .gitlab/ci/code-pushup.gitlab-ci.yml
        "
      `);
    });
  });

  describe('none', () => {
    it('should make no changes when provider is none', async () => {
      vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
      const tree = createTree(MEMFS_VOLUME);

      await resolveCi(tree, 'none', STANDALONE_CONTEXT);

      expect(tree.listChanges()).toStrictEqual([]);
    });
  });
});
