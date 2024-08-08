import type { CreateNodesContext, ProjectConfiguration } from '@nx/devkit';
import { WithRequired } from '@code-pushup/utils';
import { DynamicTargetOptions } from '../internal/types';

export type CreateNodesOptions = DynamicTargetOptions;

export type ProjectConfigurationWithName = WithRequired<
  ProjectConfiguration,
  'name'
>;

export type NormalizedCreateNodesContext = CreateNodesContext & {
  projectJson: ProjectConfigurationWithName;
  projectRoot: string;
  createOptions: CreateNodesOptions;
};
