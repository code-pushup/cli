import { executePlugin, executePlugins } from './execute-plugin';
import { mockPlugin } from './helper.mock';
import { pluginConfigSchema, runnerOutputSchema } from '@quality-metrics/models';
import { expect } from 'vitest';

describe('executePlugin', () => {
  it('should work with valid plugin', async () => {
    const cfg = pluginConfigSchema.parse(mockPlugin());
    const errorSpy = vi.fn();
    const pluginResult = await executePlugin(cfg).catch(errorSpy);
    expect(pluginResult.audits).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(() => runnerOutputSchema.parse(pluginResult)).not.toThrow();
  });

  it('should throws with invalid plugin', async () => {
    const cfg = pluginConfigSchema.parse(mockPlugin({ invalidPlugin: true }));
    const errorSpy = vi.fn();
    const pluginResult = await executePlugin(cfg).catch(errorSpy);
    expect(pluginResult).toBe(undefined);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('should throw if invalid runnerOutput is produced', async () => {
    const cfg = pluginConfigSchema.parse(
      mockPlugin({ invalidRunnerOutput: true }),
    );
    let error: Error;
    const pluginResult = await executePlugin(cfg).catch(e => {
      error = e;
    });
    expect(pluginResult).toBe(undefined);
    expect(error?.message).toContain('Expected array, received string');
  });
});

describe('executePlugins', () => {
  it('should work with valid plugins', async () => {
    const plugins = [
      pluginConfigSchema.parse(mockPlugin()),
      pluginConfigSchema.parse(mockPlugin()),
    ];
    const errorSpy = vi.fn();
    const pluginResult = await executePlugins(plugins).catch(errorSpy);
    expect(pluginResult.audits).toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(() => runnerOutputSchema.parse(pluginResult)).not.toThrow();
  });

  it('should throws with invalid plugins', async () => {
    const plugins = [
      pluginConfigSchema.parse(mockPlugin({ invalidPlugin: true })),
      pluginConfigSchema.parse(mockPlugin()),
    ];
    const errorSpy = vi.fn();
    const pluginResult = await executePlugins(plugins).catch(errorSpy);
    expect(pluginResult).toBe(undefined);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
