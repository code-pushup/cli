import { describe, expect, it } from 'vitest';
import { mockConfig } from './implementation/mock/schema-helper.mock';
import { collect, CollectOptions, readPackageJson } from '../collect/index';
import { reportSchema } from '@quality-metrics/models';

const baseOptions: CollectOptions = {
  ...mockConfig(),
  configPath: '',
  interactive: true,
  verbose: false,
};

describe('collect', () => {
  it('should execute with valid options`', async () => {
    const report = await collect(baseOptions);
    //
    const expectedPackageJson = await readPackageJson();
    expect(report.package).toBe(expectedPackageJson.name);
    expect(report.version).toBe(expectedPackageJson.version);
    expect(() => reportSchema.parse(report)).not.toThrow();
  });
});

describe('readPackageJson', () => {
  it('should read package json form @quality-metrics/cli`', async () => {
    const expectedPackageJson = await readPackageJson();
    expect(expectedPackageJson).toBe('@quality-metrics/cli');
  });
});
