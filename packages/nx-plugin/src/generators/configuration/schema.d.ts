import type { DynamicTargetOptions } from '../../internal/types';

export type ConfigurationGeneratorOptions = {
  project: string;
  bin?: string;
  skipTarget?: boolean;
  skipConfig?: boolean;
  skipFormat?: boolean;
} & DynamicTargetOptions;
