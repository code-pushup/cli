import { type InlineText, md } from 'build-md';
import { describe, expect, it } from 'vitest';
import {
  binaryIconSuffix,
  categoriesDetailsSection,
  categoriesOverviewSection,
  categoryGroupItem,
  categoryRef,
} from './generate-md-report-category-section.js';
import type { ScoredGroup, ScoredReport } from './types.js';

// === Categories Overview Section

describe('categoriesOverviewSection', () => {
  it('should render complete categories table', () => {
    expect(
      categoriesOverviewSection({
        plugins: [
          {
            slug: 'eslint',
            title: 'Eslint',
          },
          {
            slug: 'lighthouse',
            title: 'Lighthouse',
          },
        ],
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug Prevention',
            score: 0.98,
            refs: [{ slug: 'no-let', type: 'audit' }],
          },
          {
            slug: 'performance',
            title: 'Performance',
            score: 0.74,
            refs: [{ slug: 'largest-contentful-paint', type: 'audit' }],
          },
          {
            slug: 'typescript',
            title: 'Typescript',
            score: 0.14,
            refs: [{ slug: 'no-any', type: 'audit' }],
          },
        ],
      } as Required<Pick<ScoredReport, 'plugins' | 'categories'>>).toString(),
    ).toMatchSnapshot();
  });

  it('should render filtered categories table', () => {
    expect(
      categoriesOverviewSection(
        {
          plugins: [
            {
              slug: 'eslint',
              title: 'Eslint',
            },
            {
              slug: 'lighthouse',
              title: 'Lighthouse',
            },
          ],
          categories: [
            {
              slug: 'bug-prevention',
              title: 'Bug Prevention',
              score: 1,
              refs: [{ slug: 'no-let', type: 'audit' }],
            },
            {
              slug: 'performance',
              title: 'Performance',
              score: 0.74,
              refs: [{ slug: 'largest-contentful-paint', type: 'audit' }],
            },
            {
              slug: 'typescript',
              title: 'Typescript',
              score: 0.14,
              refs: [{ slug: 'no-any', type: 'audit' }],
            },
          ],
        } as Required<Pick<ScoredReport, 'plugins' | 'categories'>>,
        {
          isScoreListed: score => score === 1,
        },
      ).toString(),
    ).toMatchSnapshot();
  });

  it('should render scoreTarget icon "❌" if score fails', () => {
    expect(
      categoriesOverviewSection({
        plugins: [
          {
            slug: 'eslint',
            title: 'Eslint',
          },
        ],
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug Prevention',
            score: 0.98,
            scoreTarget: 1,
            refs: [{ slug: 'no-let', type: 'audit' }],
          },
        ],
      } as Required<Pick<ScoredReport, 'plugins' | 'categories'>>).toString(),
    ).toMatchSnapshot();
  });
});

// === Categories Details

describe('categoryRef', () => {
  it('should render partial category reference', () => {
    expect(
      categoryRef(
        {
          slug: 'score-report-performance',
          title: 'Score Report Performance',
          value: 12_245,
          score: 1,
        },
        'lighthouse',
      ).toString(),
    ).toBe(
      '🟩 [Score Report Performance](#score-report-performance-lighthouse) (_lighthouse_) - **12245**',
    );
  });

  it('should render complete category reference', () => {
    expect(
      categoryRef(
        {
          slug: 'score-report-performance',
          title: 'Score Report Performance',
          value: 1,
          score: 0,
          displayValue: '12 errors',
        },
        'lighthouse',
      ).toString(),
    ).toBe(
      '🟥 [Score Report Performance](#score-report-performance-lighthouse) (_lighthouse_) - **12 errors**',
    );
  });
});

describe('categoryGroupItem', () => {
  const printAsListItem = (text: InlineText) => md.list([text]).toString();

  it('should render partial category reference', () => {
    expect(
      printAsListItem(
        categoryGroupItem(
          {
            slug: 'bug-prevention',
            title: 'Bug Prevention',
            score: 0.9,
          } as ScoredGroup,
          [
            { title: 'No let', slug: 'no-let', score: 0, value: 23 },
            { title: 'No any', slug: 'no-any', score: 0.6, value: 91 },
          ],
          'Eslint',
        ),
      ),
    ).toMatchSnapshot();
  });

  it('should render complete category reference', () => {
    expect(
      printAsListItem(
        categoryGroupItem(
          {
            slug: 'bug-prevention',
            title: 'Bug Prevention',
            score: 0.6,
          } as ScoredGroup,
          [
            {
              title: 'No any',
              slug: 'no-any',
              score: 0,
              value: 12,
              displayValue: '12 errors',
            },
            { title: 'No let', slug: 'no-let', score: 1, value: 0 },
          ],
          'Eslint',
        ),
      ),
    ).toMatchSnapshot();
  });
});

describe('categoriesDetailsSection', () => {
  it('should render complete categories details', () => {
    expect(
      categoriesDetailsSection({
        plugins: [
          {
            slug: 'eslint',
            title: 'Eslint',
            audits: [
              { slug: 'no-let', title: 'No let', score: 0, value: 5 },
              { slug: 'no-any', title: 'No any', score: 1, value: 0 },
            ],
          },
          {
            slug: 'lighthouse',
            title: 'Lighthouse',
            audits: [
              {
                slug: 'largest-contentful-paint',
                title: 'Largest Contentful Paint',
                score: 0.7,
                value: 2905,
              },
            ],
          },
        ],
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug Prevention',
            score: 1,
            scoreTarget: 1,
            refs: [{ slug: 'no-let', type: 'audit', plugin: 'eslint' }],
          },
          {
            slug: 'performance',
            title: 'Performance',
            score: 0.74,
            refs: [
              {
                slug: 'largest-contentful-paint',
                type: 'audit',
                plugin: 'lighthouse',
              },
            ],
          },
          {
            slug: 'typescript',
            title: 'Typescript',
            score: 0.14,
            scoreTarget: 1,
            refs: [{ slug: 'no-any', type: 'audit', plugin: 'eslint' }],
          },
        ],
      } as Required<Pick<ScoredReport, 'plugins' | 'categories'>>).toString(),
    ).toMatchSnapshot();
  });

  it('should render filtered categories details', () => {
    expect(
      categoriesDetailsSection(
        {
          plugins: [
            {
              slug: 'eslint',
              title: 'Eslint',
              audits: [
                { slug: 'no-let', title: 'No let', score: 1, value: 0 },
                { slug: 'no-any', title: 'No any', score: 0, value: 5 },
              ],
            },
            {
              slug: 'lighthouse',
              title: 'Lighthouse',
              audits: [
                {
                  slug: 'largest-contentful-paint',
                  title: 'Largest Contentful Paint',
                  score: 0.7,
                  value: 2905,
                },
              ],
            },
          ],
          categories: [
            {
              slug: 'bug-prevention',
              title: 'Bug Prevention',
              score: 1,
              scoreTarget: 1,
              refs: [{ slug: 'no-let', type: 'audit', plugin: 'eslint' }],
            },
            {
              slug: 'performance',
              title: 'Performance',
              score: 0.74,
              refs: [
                {
                  slug: 'largest-contentful-paint',
                  type: 'audit',
                  plugin: 'lighthouse',
                },
              ],
            },
            {
              slug: 'typescript',
              title: 'Typescript',
              score: 0.14,
              scoreTarget: 1,
              refs: [{ slug: 'no-any', type: 'audit', plugin: 'eslint' }],
            },
          ],
        } as Required<Pick<ScoredReport, 'plugins' | 'categories'>>,
        {
          isScoreListed: score => score === 1,
        },
      ).toString(),
    ).toMatchSnapshot('filtered');
  });

  it('should render categories details and add "❌" when score < scoreTarget', () => {
    expect(
      categoriesDetailsSection({
        plugins: [
          {
            slug: 'eslint',
            title: 'Eslint',
            audits: [{ slug: 'no-let', title: 'No let', score: 0, value: 5 }],
          },
        ],
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug Prevention',
            score: 0.98,
            scoreTarget: 1,
            refs: [{ slug: 'no-let', type: 'audit', plugin: 'eslint' }],
          },
        ],
      } as Required<Pick<ScoredReport, 'plugins' | 'categories'>>).toString(),
    ).toMatchSnapshot();
  });

  it('should render categories details and add "✅" when score >= scoreTarget', () => {
    expect(
      categoriesDetailsSection({
        plugins: [
          {
            slug: 'eslint',
            title: 'Eslint',
            audits: [{ slug: 'no-let', title: 'No let', score: 1, value: 5 }],
          },
        ],
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug Prevention',
            score: 1,
            scoreTarget: 1,
            refs: [{ slug: 'no-let', type: 'audit', plugin: 'eslint' }],
          },
        ],
      } as Required<Pick<ScoredReport, 'plugins' | 'categories'>>).toString(),
    ).toMatchSnapshot();
  });
});

describe('binaryIconSuffix', () => {
  it('should return passing binarySuffix when score >= scoreTarget', () => {
    expect(binaryIconSuffix(1, 1)).toBe(' ✅');
  });

  it('should return failing binarySuffix when score < scoreTarget', () => {
    expect(binaryIconSuffix(0, 1)).toBe(' ❌');
  });

  it('should return NO binarySuffix when scoreTarget is undefined', () => {
    expect(binaryIconSuffix(1, undefined)).toBe('');
  });
});
