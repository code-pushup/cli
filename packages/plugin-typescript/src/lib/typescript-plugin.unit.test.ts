import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { typescriptPlugin } from './typescript-plugin.js';

describe('typescriptPlugin-config-object', () => {
  it('should create valid plugin config', () => {
    const pluginConfig = typescriptPlugin({
      tsConfigPath:
        'packages/plugin-typescript/mocks/fixtures/basic-setup/tsconfig.json',
    });
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits.length).toBeGreaterThan(1000);
    expect(groups).toStrictEqual([]);
  });
});
