import { describe, expect, it } from 'vitest';
import { getAuditsFromConfigs, prepareDescription } from './normalize.js';
import type { BundleStatsConfig } from './runner/types.js';
import type { BundleStatsOptions } from './types.js';

describe('prepareDescription', () => {
  it('should enhance description with all configuration details when all options are present', () => {
    const options: BundleStatsConfig = {
      title: 'Test Bundle Analysis',
      slug: 'test-bundle-analysis',
      description: 'Select only chunk files in dist/chunks',
      selection: {
        includeOutputs: ['dist/chunks/**', '*.js'],
        excludeOutputs: ['*.test.js'],
        includeInputs: ['src/**'],
        excludeInputs: [],
        includeEntryPoints: ['main.js'],
        excludeEntryPoints: ['test.js'],
      },
      scoring: {
        totalSize: [0, 1000],
        penalty: {
          errorWeight: 2,
          warningWeight: 1,
          artefactSize: [50, 200],
        },
      },
    };

    expect(prepareDescription(options)).toMatchInlineSnapshot(`
      "Select only chunk files in dist/chunks

      <details>
      <summary>⚙️ Config Summary</summary>

      **Selection**
      • \`includeOutputs\`: \`dist/chunks/**\`, \`*.js\`
      • \`excludeOutputs\`: \`*.test.js\`
      • \`includeInputs\`: \`src/**\`
      • \`includeEntryPoints\`: \`main.js\`
      • \`excludeEntryPoints\`: \`test.js\`

      **Scoring**
      • \`totalSize\`: \`0 B – 1000 B\`
      • \`penalty.artefactSize\`: \`50 B – 200 B\`
      • \`penalty.weights\`: \`warning ×1, error ×2\`

      </details>"
    `);
  });
});
