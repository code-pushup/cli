import { reportSchema } from '@quality-metrics/models';
import { mockCoreConfig } from '@quality-metrics/models/testing';
import type { PackageJson } from 'type-fest';
import { describe, expect, it } from 'vitest';
import { CollectOptions, collect } from '../collect/';

const baseOptions: CollectOptions = {
  ...mockCoreConfig(),
  configPath: '',
  interactive: true,
  verbose: false,
};

describe('collect', () => {
  it('should execute with valid options`', async () => {
    const packageJson: PackageJson = {
      name: '@code-pushup/cli',
      version: '0.1.0',
    };
    const report = await collect({ ...baseOptions, packageJson });
    expect(report.packageName).toBe(packageJson.name);
    expect(report.version).toBe(packageJson.version);
    expect(() => reportSchema.parse(report)).not.toThrow();
  });
});
