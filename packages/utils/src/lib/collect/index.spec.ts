import { describe, expect, it } from 'vitest';
import { collect, CollectOptions } from '../collect/index';
import { reportSchema } from '@quality-metrics/models';
import { readPackageJson } from './implementation/utils';
import { mockCoreConfig } from '@quality-metrics/models/testing';

const baseOptions: CollectOptions = {
  ...mockCoreConfig(),
  configPath: '',
  interactive: true,
  verbose: false,
};

describe('collect', () => {
  it('should execute with valid options`', async () => {
    const report = await collect(baseOptions);
    //
    const expectedPackageJson = await readPackageJson();
    expect(report.packageName).toBe(expectedPackageJson.name);
    expect(report.version).toBe(expectedPackageJson.version);
    expect(() => reportSchema.parse(report)).not.toThrow();
  });
});

describe('readPackageJson', () => {
  it('should read package json form @quality-metrics/cli`', async () => {
    const expectedPackageJson = await readPackageJson();
    expect(expectedPackageJson.name).toBe('@quality-metrics/cli');
  });
});
