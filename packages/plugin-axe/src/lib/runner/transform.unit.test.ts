import type { AxeResults, NodeResult, Result } from 'axe-core';
import { describe, expect, it } from 'vitest';
import type { AuditOutput } from '@code-pushup/models';
import { toAuditOutputs } from './transform.js';

function createMockNode(overrides: Partial<NodeResult> = {}): NodeResult {
  return {
    html: '<div></div>',
    target: ['div'],
    ...overrides,
  } as NodeResult;
}

function createMockResult(id: string, nodes = [createMockNode()]): Result {
  return {
    id,
    description: `Mock description for ${id}`,
    help: `Mock help for ${id}`,
    helpUrl: `https://example.com/${id}`,
    tags: ['wcag2a'],
    nodes,
  } as Result;
}

function createMockAxeResults(overrides: Partial<AxeResults> = {}): AxeResults {
  return {
    passes: [],
    violations: [],
    incomplete: [],
    inapplicable: [],
    ...overrides,
  } as AxeResults;
}

describe('toAuditOutputs', () => {
  const testUrl = 'https://example.com';

  it('should transform passes with score 1 and no issues', () => {
    const results = createMockAxeResults({
      passes: [
        createMockResult('color-contrast', [
          createMockNode(),
          createMockNode(),
          createMockNode(),
        ]),
      ],
    });

    expect(toAuditOutputs(results, testUrl)).toEqual<AuditOutput[]>([
      {
        slug: 'color-contrast',
        score: 1,
        value: 3,
        displayValue: '3 elements',
      },
    ]);
  });

  it('should transform violations with score 0 and include issues', () => {
    const results = createMockAxeResults({
      violations: [
        createMockResult('image-alt', [
          createMockNode({
            html: '<img src="logo.png">',
            target: ['img'],
            impact: 'critical',
            failureSummary: 'Fix this: Element does not have an alt attribute',
          }),
          createMockNode({
            html: '<img src="icon.svg">',
            target: ['.header > img:nth-child(2)'],
            impact: 'serious',
            failureSummary: 'Fix this: Element does not have an alt attribute',
          }),
          createMockNode({
            html: '<img src="banner.jpg">',
            target: ['#main img'],
            impact: 'critical',
          }),
        ]),
      ],
    });

    expect(toAuditOutputs(results, testUrl)).toEqual<AuditOutput[]>([
      {
        slug: 'image-alt',
        score: 0,
        value: 3,
        displayValue: '3 errors',
        details: {
          issues: [
            {
              message:
                '[img] Fix this: Element does not have an alt attribute (https://example.com)',
              severity: 'error',
            },
            {
              message:
                '[.header > img:nth-child(2)] Fix this: Element does not have an alt attribute (https://example.com)',
              severity: 'error',
            },
            {
              message:
                '[#main img] Mock help for image-alt (https://example.com)',
              severity: 'error',
            },
          ],
        },
      },
    ]);
  });

  it('should transform incomplete with score 0 and include issues', () => {
    const results = createMockAxeResults({
      incomplete: [
        createMockResult('color-contrast', [
          createMockNode({
            html: '<button>Click me</button>',
            target: ['button'],
            impact: 'moderate',
            failureSummary: 'Fix this: Element has insufficient color contrast',
          }),
          createMockNode({
            html: '<a href="#">Link</a>',
            target: ['a'],
            impact: 'moderate',
            failureSummary: 'Review: Unable to determine contrast ratio',
          }),
        ]),
      ],
    });

    expect(toAuditOutputs(results, testUrl)).toEqual<AuditOutput[]>([
      {
        slug: 'color-contrast',
        score: 0,
        value: 2,
        displayValue: '2 warnings',
        details: {
          issues: [
            {
              message:
                '[button] Fix this: Element has insufficient color contrast (https://example.com)',
              severity: 'warning',
            },
            {
              message:
                '[a] Review: Unable to determine contrast ratio (https://example.com)',
              severity: 'warning',
            },
          ],
        },
      },
    ]);
  });

  it('should transform inapplicable with score 1 and no issues', () => {
    const results = createMockAxeResults({
      inapplicable: [createMockResult('audio-caption', [])],
    });

    expect(toAuditOutputs(results, testUrl)).toEqual<AuditOutput[]>([
      {
        slug: 'audio-caption',
        score: 1,
        value: 0,
        displayValue: '0 elements',
      },
    ]);
  });

  it('should deduplicate audits with priority: violations > incomplete > passes > inapplicable', () => {
    const results = createMockAxeResults({
      inapplicable: [createMockResult('color-contrast', [])],
      passes: [
        createMockResult('color-contrast', [
          createMockNode(),
          createMockNode(),
          createMockNode(),
        ]),
      ],
      incomplete: [
        createMockResult('color-contrast', [
          createMockNode({ impact: 'moderate' }),
          createMockNode({ impact: 'moderate' }),
        ]),
      ],
      violations: [
        createMockResult('color-contrast', [
          createMockNode({ impact: 'critical' }),
        ]),
      ],
    });

    const outputs = toAuditOutputs(results, testUrl);

    expect(outputs).toHaveLength(1);
    expect(outputs[0]).toMatchObject({
      slug: 'color-contrast',
      score: 0,
      value: 1,
      displayValue: '1 error',
    });
  });

  it('should handle empty results', () => {
    expect(toAuditOutputs(createMockAxeResults(), testUrl)).toEqual([]);
  });

  it('should format severity counts when multiple impacts exist', () => {
    const results = createMockAxeResults({
      violations: [
        createMockResult('color-contrast', [
          createMockNode({ impact: 'critical' }),
          createMockNode({ impact: 'serious' }),
          createMockNode({ impact: 'moderate' }),
          createMockNode({ impact: 'minor' }),
        ]),
      ],
    });

    const outputs = toAuditOutputs(results, testUrl);

    expect(outputs[0]).toMatchObject({
      slug: 'color-contrast',
      score: 0,
      value: 4,
      displayValue: '2 errors, 1 warning, 1 info',
    });
  });
});
