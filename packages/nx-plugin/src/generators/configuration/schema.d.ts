import type { DynamicTargetOptions } from '../../internal/types.js';

export type ConfigurationGeneratorOptions = {
  project: string;
  skipTarget?: boolean;
  skipConfig?: boolean;
  skipFormat?: boolean;
} & DynamicTargetOptions;
