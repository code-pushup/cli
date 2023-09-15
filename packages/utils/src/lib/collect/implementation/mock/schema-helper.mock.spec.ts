import { describe } from 'vitest';
import {
  coreConfigSchema,
  pluginConfigSchema,
  reportSchema,
} from '@quality-metrics/models';
import {dummyConfig, dummyReport} from "./config-and-report-dummy.mock";
import {
  nxValidatorsOnlyConfig,
  nxValidatorsOnlyReport,
  nxValidatorsPlugin
} from "./config-and-report-nx-validators.mock";
import {lighthouseConfig, lighthousePlugin, lighthouseReport} from "./config-and-report-lighthouse.mock";


// @NOTICE ATM the data structure changes a lot so this test is a temporarily check to see if the dummy data are correct
describe('dummy data', () => {
  it('is valid', () => {
    expect(() => coreConfigSchema.parse(dummyConfig)).not.toThrow();
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
