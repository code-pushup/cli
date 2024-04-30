import { describe, expect, it } from 'vitest';
import {
  categoriesDetailsSection,
  categoriesOverviewSection,
  categoryGroupItem,
  categoryRef,
} from './generate-md-report-categoy-section';
import { ScoredGroup, ScoredReport } from './types';

// === Categories Overview Section

describe('categoriesOverviewSection', () => {
  it('should skip categories table if categories are empty', () => {
    const md = categoriesOverviewSection({
      plugins: [],
      categories: [],
    });
    expect(md).toBe('');
  });

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
      } as ScoredReport),
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
      ),
    ).toBe(
      '- 🟩 [Score Report Performance](#score-report-performance-lighthouse) (_lighthouse_) - **12245**',
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
      ),
    ).toBe(
      '- 🟥 [Score Report Performance](#score-report-performance-lighthouse) (_lighthouse_) - **12 errors**',
    );
  });
});

describe('categoryGroupItem', () => {
  it('should render partial category reference', () => {
    expect(
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
    ).toMatchSnapshot();
  });

  it('should render complete category reference', () => {
    expect(
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
    ).toMatchSnapshot();
  });
});

describe('categoriesDetails', () => {
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
            score: 0.98,
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
            refs: [{ slug: 'no-any', type: 'audit', plugin: 'eslint' }],
          },
        ],
      } as ScoredReport),
    ).toMatchSnapshot();
  });
});
