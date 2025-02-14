import { expect } from 'vitest';
import { pluginConfigSchema } from '@code-pushup/models';
import { AUDITS, GROUPS } from './constants.js';
import { typescriptPlugin } from './typescript-plugin.js';

describe('typescriptPlugin-config-object', () => {
  it('should create valid plugin config without options', async () => {
    const pluginConfig = await typescriptPlugin();

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits).toHaveLength(AUDITS.length);
    expect(groups).toBeDefined();
    expect(groups!).toHaveLength(GROUPS.length);
  });

  it('should create valid plugin config', async () => {
    const pluginConfig = await typescriptPlugin({
      tsConfigPath: 'mocked-away/tsconfig.json',
      onlyAudits: ['syntax-errors', 'semantic-errors', 'configuration-errors'],
    });

    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();

    const { audits, groups } = pluginConfig;
    expect(audits).toHaveLength(3);
    expect(groups).toBeDefined();
    expect(groups!).toHaveLength(2);
  });
});
