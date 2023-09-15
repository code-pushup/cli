import {describe} from "vitest";
import {coreConfigSchema, pluginConfigSchema, reportSchema} from "@quality-metrics/models";
import {
  dummyConfig,
  dummyReport,
  nxValidatorsOnlyConfig,
  nxValidatorsOnlyReport,
  nxValidatorsPlugin
} from "./config-and-report.mock";

// @NOTICE ATM the data structure changes a lot so this test is a temporarily check to see if the dummy data are correct
describe('dummy data', () => {
  it('is valid', () => {
    expect(() => coreConfigSchema.parse(dummyConfig)).not.toThrow();
    expect(() => reportSchema.parse(dummyReport)).not.toThrow();
  });
});

// @NOTICE ATM the data structure changes a lot so this test is a temporarily check to see if the dummy data are correct
describe('Nx Validators data', () => {
  it('is valid', () => {
    expect(() => pluginConfigSchema.parse(nxValidatorsPlugin())).not.toThrow();
    expect(() => coreConfigSchema.parse(nxValidatorsOnlyConfig)).not.toThrow();
    expect(() => reportSchema.parse(nxValidatorsOnlyReport)).not.toThrow();
  });
});
