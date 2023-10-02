import { reportSchema } from '@quality-metrics/models';
import { mockCoreConfig } from '@quality-metrics/models/testing';
import { describe, expect, it } from 'vitest';
import { CollectOptions, collect } from './collect';

const baseOptions: CollectOptions = {
  ...mockCoreConfig(),
  configPath: '',
  interactive: true,
  verbose: false,
};

describe('collect', () => {
  it('should execute with valid options`', async () => {
    const report = await collect(baseOptions);
    expect(() =>
      reportSchema.omit({ packageName: true, version: true }).parse(report),
    ).not.toThrow();
  });
});
