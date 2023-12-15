import { z } from 'zod';
import {
  PERSIST_FILENAME,
  PERSIST_FORMAT,
  PERSIST_OUTPUT_DIR,
  UPLOAD_SERVER,
  fileNameSchema,
  filePathSchema,
  formatSchema,
  urlSchema,
} from '@code-pushup/models';

export type GlobalOptions = {
  //  'Show progress bar in stdout'
  progress: boolean;
  //  Outputs additional information for a run'
  verbose: boolean;
};

export const persistConfigPresetSchema = z.object({
  outputDir: filePathSchema('').default(PERSIST_OUTPUT_DIR),
  filename: fileNameSchema('').default(PERSIST_FILENAME),
  format: z.array(formatSchema).default(['json']).default(PERSIST_FORMAT),
});

export const uploadConfigPresetSchema = z.object({
  server: urlSchema('').default(UPLOAD_SERVER),
  apiKey: z.string(),
  organization: z.string(),
  project: z.string(),
});
