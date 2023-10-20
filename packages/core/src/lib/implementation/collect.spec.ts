import { describe, expect, it } from 'vitest';
import { CoreConfig, reportSchema } from '@code-pushup/models';
import { mockCoreConfig } from '@code-pushup/models/testing';
import { CollectOptions, collect } from './collect';

const baseOptions: CollectOptions = {
  ...(mockCoreConfig() as Required<CoreConfig>),
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
