import type { CreateNodesContext, ProjectConfiguration } from '@nx/devkit';
import { DynamicTargetOptions } from '../internal/types';

export type CreateNodesOptions = DynamicTargetOptions;

export type NormalizedCreateNodesContext = CreateNodesContext & {
  projectJson: Omit<ProjectConfiguration, 'name'> & Required<Pick<ProjectConfiguration, 'name'>>;
  projectRoot: string;
  createOptions: CreateNodesOptions;
};
