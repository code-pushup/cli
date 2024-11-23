import type { CreateNodesContext, ProjectConfiguration } from '@nx/devkit';
import type { WithRequired } from '@code-pushup/utils';
import type { DynamicTargetOptions } from '../internal/types';

export type ProjectPrefixOptions = {
  projectPrefix?: string;
};

export type CreateNodesOptions = DynamicTargetOptions & ProjectPrefixOptions;

export type ProjectConfigurationWithName = WithRequired<
  ProjectConfiguration,
  'name'
>;

export type NormalizedCreateNodesOptions = Omit<
  CreateNodesOptions,
  'targetName'
> &
  Required<Pick<CreateNodesOptions, 'targetName'>>;
export type NormalizedCreateNodesContext = CreateNodesContext & {
  projectJson: ProjectConfigurationWithName;
  projectRoot: string;
  createOptions: NormalizedCreateNodesOptions;
};
