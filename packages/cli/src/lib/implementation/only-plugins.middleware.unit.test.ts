import { describe, expect, vi } from 'vitest';
import { onlyPluginsMiddleware } from './only-plugins.middleware';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
    autoloadRc: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('onlyPluginsMiddleware', () => {
  it('should forward equal values if not set', () => {
    expect(
      onlyPluginsMiddleware({
        plugins: [],
        categories: [],
      }),
    ).toStrictEqual({
      plugins: [],
      categories: [],
    });
  });

  it('should filter plugins', () => {
    const { plugins } = onlyPluginsMiddleware({
      onlyPlugins: ['p1'],
      plugins: [
        {
          slug: 'p1',
          title: 'P 1',
          icon: 'git',
          audits: [{ slug: 'a1', title: 'a1-p1' }],
          runner: () => [{ slug: 'a1-p1', score: 1, value: 1 }],
        },
        {
          slug: 'p2',
          title: 'P 2',
          icon: 'git',
          audits: [{ slug: 'a1', title: 'a1-p2' }],
          runner: () => [{ slug: 'a1-p2', score: 1, value: 1 }],
        },
      ],
      categories: [],
    });
    expect(plugins).toStrictEqual([expect.objectContaining({ slug: 'p1' })]);
  });

  it('should filter categories', () => {
    const { categories } = onlyPluginsMiddleware({
      onlyPlugins: ['p1'],
      plugins: [
        {
          slug: 'p1',
          title: 'P 1',
          icon: 'git',
          audits: [
            { slug: 'a1', title: 'a1-p1' },
            { slug: 'a2', title: 'a2-p1' },
          ],
          runner: () => [{ slug: 'a1-p1', score: 1, value: 1 }],
        },
        {
          slug: 'p2',
          title: 'P 2',
          icon: 'git',
          audits: [{ slug: 'a1', title: 'a1-p2' }],
          runner: () => [{ slug: 'a1-p2', score: 1, value: 1 }],
        },
      ],
      categories: [
        {
          slug: 'c1',
          title: 'C 1',
          refs: [
            { plugin: 'p1', slug: 'a1-p1', type: 'audit', weight: 1 },
            { plugin: 'p2', slug: 'a1-p2', type: 'audit', weight: 1 },
          ],
        },
        {
          slug: 'c2',
          title: 'C 2',
          refs: [{ plugin: 'p2', slug: 'a1-p2', type: 'audit', weight: 1 }],
        },
      ],
    });
    expect(categories).toStrictEqual([
      expect.objectContaining({
        slug: 'c1',
        refs: [{ plugin: 'p1', slug: 'a1-p1', type: 'audit', weight: 1 }],
      }),
    ]);
  });
});
