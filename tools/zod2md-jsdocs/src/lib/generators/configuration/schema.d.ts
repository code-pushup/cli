import type { Config } from 'zod2md';

export type ConfigurationGeneratorOptions = Config & {
  project: string;
  skipConfig?: boolean;
  skipFormat?: boolean;
};
