import { z } from 'zod';
import { globalOptionsSchema } from '@code-pushup/core';
import { Format, filePathSchema } from '@code-pushup/models';

export const generalCliOptions = z
  .object({
    config: filePathSchema(
      "Path to config file in format `ts` or `mjs`. defaults to 'code-pushup.config.js'",
    ).default('code-pushup.config.js'),
  })
  .merge(globalOptionsSchema);

export type GeneralCliOptions = z.infer<typeof generalCliOptions>;

export type CoreConfigCliOptions = {
  'persist.outputDir': string;
  'persist.filename': string;
  'persist.format': Format;
  'upload.organization': string;
  'upload.project': string;
  'upload.apiKey': string;
  'upload.server': string;
};
