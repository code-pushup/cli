import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { AUDITS, GROUPS } from './constants.js';
import { typescriptPlugin } from './typescript-plugin.js';

describe('typescriptPlugin-config-object', () => {
  it('should create valid plugin config', async () => {
    const pluginConfig = await typescriptPlugin({
      tsConfigPath:
        'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
    });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits).toHaveLength(AUDITS.length);
    expect(groups).toBeDefined();
    expect(groups!).toHaveLength(GROUPS.length);
  });
});
