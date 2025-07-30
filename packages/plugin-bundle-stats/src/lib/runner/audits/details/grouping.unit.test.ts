import { describe, expect, it } from 'vitest';
import type { GroupingRule } from '../../types';
import {
  type StatsTreeNode,
  applyGrouping,
  findMatchingRule,
} from './grouping';

describe('GroupingRule exclude logic', () => {
  it('should exclude paths that match exclude patterns even when they match include patterns', () => {
    const rule: GroupingRule = {
      includeInputs: '**/node_modules/**',
      excludeInputs: [
        '**/node_modules/react/**',
        '**/node_modules/@angular/**',
      ],
    };

    // These paths match include but should be excluded
    expect(findMatchingRule('node_modules/react/index.js', [rule])).toBeNull();
    expect(
      findMatchingRule('node_modules/@angular/core/index.js', [rule]),
    ).toBeNull();

    // This path matches include and is not excluded
    expect(findMatchingRule('node_modules/lodash/index.js', [rule])).toEqual(
      rule,
    );
  });

  it('should handle multiple exclude patterns', () => {
    const rule: GroupingRule = {
      includeInputs: '**/src/**',
      excludeInputs: ['**/*.test.ts', '**/*.spec.ts', '**/src/legacy/**'],
    };

    // These should be excluded
    expect(findMatchingRule('src/app.test.ts', [rule])).toBeNull();
    expect(findMatchingRule('src/utils.spec.ts', [rule])).toBeNull();
    expect(findMatchingRule('src/legacy/old-code.ts', [rule])).toBeNull();

    // This should match
    expect(findMatchingRule('src/app.ts', [rule])).toEqual(rule);
  });
});
