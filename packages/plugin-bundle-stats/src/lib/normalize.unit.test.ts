import { describe, expect, it } from 'vitest';
import { getAuditsFromConfigs, prepareDescription } from './normalize.js';
import type { BundleStatsConfig } from './runner/types.js';
import type { BundleStatsOptions } from './types.js';

describe('prepareDescription', () => {
  it('should enhance description with all configuration details when all options are present', () => {
    const options: BundleStatsOptions = {
      title: 'Test Bundle Analysis',
      description: 'Select only chunk files in dist/chunks',
      selection: {
        includeOutputs: ['dist/chunks/**', '*.js'],
        excludeOutputs: ['*.test.js'],
        includeInputs: ['src/**'],
        excludeInputs: [],
        includeEntryPoints: ['main.js'],
        excludeEntryPoints: ['test.js'],
      },
      thresholds: {
        totalSize: 1000,
      },
      penalty: {
        errorWeight: 2,
        warningWeight: 1,
        artefactSize: [50, 200],
      },
    };

    expect(prepareDescription(options)).toMatchInlineSnapshot(`
      "Select only chunk files in dist/chunks
      ##### 🔍  Selection Options
      • **Include outputs:** \`dist/chunks/**\`, \`*.js\`
      • **Exclude outputs:** \`*.test.js\`
      • **Include inputs:** \`src/**\`
      • **Include entry points:** \`main.js\`
      • **Exclude entry points:** \`test.js\`

      📏 **Sizes:** total \`0–1000\` bytes
      ⚖️ **Penalties:** error \`2\` | warn \`1\` | artefact \`50–200\` bytes
      "
    `);
  });
});
