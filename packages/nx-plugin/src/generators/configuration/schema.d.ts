import { DynamicTargetOptions } from '../../internal/types';

export type ConfigurationGeneratorOptions = {
  project: string;
  skipTarget?: boolean;
  skipConfig?: boolean;
  skipFormat?: boolean;
} & DynamicTargetOptions;
