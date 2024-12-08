import type { Report } from '@code-pushup/models';
import {
  listAuditsFromAllPlugins,
  listGroupsFromAllPlugins,
} from './flatten-plugins.js';

describe('listGroupsFromAllPlugins', () => {
  it("should flatten plugins' groups", () => {
    expect(
      listGroupsFromAllPlugins({
        plugins: [
          {
            slug: 'eslint',
            groups: [
              { slug: 'problems' },
              { slug: 'suggestions' },
              { slug: 'formatting' },
            ],
          },
          {
            slug: 'lighthouse',
            groups: [
              { slug: 'performance' },
              { slug: 'accessibility' },
              { slug: 'best-practices' },
              { slug: 'seo' },
            ],
          },
        ],
      } as Report),
    ).toEqual([
      {
        group: expect.objectContaining({ slug: 'problems' }),
        plugin: expect.objectContaining({ slug: 'eslint' }),
      },
      {
        group: expect.objectContaining({ slug: 'suggestions' }),
        plugin: expect.objectContaining({ slug: 'eslint' }),
      },
      {
        group: expect.objectContaining({ slug: 'formatting' }),
        plugin: expect.objectContaining({ slug: 'eslint' }),
      },
      {
        group: expect.objectContaining({ slug: 'performance' }),
        plugin: expect.objectContaining({ slug: 'lighthouse' }),
      },
      {
        group: expect.objectContaining({ slug: 'accessibility' }),
        plugin: expect.objectContaining({ slug: 'lighthouse' }),
      },
      {
        group: expect.objectContaining({ slug: 'best-practices' }),
        plugin: expect.objectContaining({ slug: 'lighthouse' }),
      },
      {
        group: expect.objectContaining({ slug: 'seo' }),
        plugin: expect.objectContaining({ slug: 'lighthouse' }),
      },
    ]);
  });
});

describe('listAuditsFromAllPlugins', () => {
  it("should flatten plugins' audits", () => {
    expect(
      listAuditsFromAllPlugins({
        plugins: [
          {
            slug: 'coverage',
            audits: [
              { slug: 'function-coverage' },
              { slug: 'branch-coverage' },
              { slug: 'statement-coverage' },
            ],
          },
          {
            slug: 'js-packages',
            audits: [{ slug: 'audit' }, { slug: 'outdated' }],
          },
        ],
      } as Report),
    ).toEqual([
      {
        audit: expect.objectContaining({ slug: 'function-coverage' }),
        plugin: expect.objectContaining({ slug: 'coverage' }),
      },
      {
        audit: expect.objectContaining({ slug: 'branch-coverage' }),
        plugin: expect.objectContaining({ slug: 'coverage' }),
      },
      {
        audit: expect.objectContaining({ slug: 'statement-coverage' }),
        plugin: expect.objectContaining({ slug: 'coverage' }),
      },
      {
        audit: expect.objectContaining({ slug: 'audit' }),
        plugin: expect.objectContaining({ slug: 'js-packages' }),
      },
      {
        audit: expect.objectContaining({ slug: 'outdated' }),
        plugin: expect.objectContaining({ slug: 'js-packages' }),
      },
    ]);
  });
});
