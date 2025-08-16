import type { DynamicTargetOptions } from '../../internal/types.js';

export type ConfigurationGeneratorOptions = {
  project: string;
  bin?: string;
  skipTarget?: boolean;
  skipConfig?: boolean;
  skipFormat?: boolean;
} & DynamicTargetOptions;
