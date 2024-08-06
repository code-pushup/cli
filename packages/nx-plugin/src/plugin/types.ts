import type { CreateNodesContext, ProjectConfiguration } from '@nx/devkit';
import { DynamicTargetOptions } from '../internal/types';

export type CreateNodesOptions = DynamicTargetOptions;

export type ProjectConfigWithName = Omit<ProjectConfiguration, 'name'> &
  Required<Pick<ProjectConfiguration, 'name'>>;
export type NormalizedCreateNodesContext = CreateNodesContext & {
  projectJson: ProjectConfigWithName;
  projectRoot: string;
  createOptions: CreateNodesOptions;
};
