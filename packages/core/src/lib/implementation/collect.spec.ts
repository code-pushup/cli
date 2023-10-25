import { beforeEach, describe, expect, it } from 'vitest';
import { reportSchema } from '@code-pushup/models';
import { minimalConfig } from '@code-pushup/models/testing';
import { cleanFolder } from '../../../test';
import { DEFAULT_TESTING_CLI_OPTIONS } from '../../../test/constants';
import { CollectOptions, collect } from './collect';

const baseOptions: CollectOptions = {
  ...minimalConfig(),
  ...DEFAULT_TESTING_CLI_OPTIONS,
};

describe('collect', () => {
  beforeEach(() => {
    cleanFolder();
  });

  afterEach(() => {
    cleanFolder();
  });
  it('should execute with valid options', async () => {
    const report = await collect(baseOptions);
    expect(() =>
      reportSchema.omit({ packageName: true, version: true }).parse(report),
    ).not.toThrow();
    expect(report.plugins[0]?.audits[0]?.slug).toBe('audit-1');
  });
});
