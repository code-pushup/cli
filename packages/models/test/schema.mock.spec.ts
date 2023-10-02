import { describe, expect, it } from 'vitest';
import { coreConfigSchema, pluginConfigSchema, reportSchema } from '../src';
import {
  dummyConfig,
  dummyReport,
} from './test-data/config-and-report-dummy.mock';
import {
  lighthouseConfig,
  lighthousePlugin,
  lighthouseReport,
} from './test-data/config-and-report-lighthouse.mock';
import {
  nxValidatorsOnlyConfig,
  nxValidatorsOnlyReport,
  nxValidatorsPlugin,
} from './test-data/config-and-report-nx-validators.mock';

// @NOTICE ATM the data structure changes a lot so this test is a temporarily check to see if the dummy data are correct
describe('dummy data', () => {
  it('is valid', () => {
    expect(() => coreConfigSchema.parse(dummyConfig())).not.toThrow();
    expect(() => reportSchema.parse(dummyReport)).not.toThrow();
  });
});

describe('Nx Validators data', () => {
  it('is valid', () => {
    expect(() => pluginConfigSchema.parse(nxValidatorsPlugin())).not.toThrow();
    expect(() => coreConfigSchema.parse(nxValidatorsOnlyConfig)).not.toThrow();
    expect(() => reportSchema.parse(nxValidatorsOnlyReport)).not.toThrow();
  });
});

describe('lighthouse data', () => {
  it('is valid', () => {
    expect(() => pluginConfigSchema.parse(lighthousePlugin())).not.toThrow();
    expect(() => coreConfigSchema.parse(lighthouseConfig)).not.toThrow();
    expect(() => reportSchema.parse(lighthouseReport)).not.toThrow();
  });
});
