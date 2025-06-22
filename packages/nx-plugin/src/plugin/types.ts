import type {
  CreateNodesContext,
  CreateNodesContextV2,
  ProjectConfiguration,
} from '@nx/devkit';
import type { WithRequired } from '@code-pushup/utils';
import type { DynamicTargetOptions } from '../internal/types.js';
import type { CreateTargetsOptions } from './target/targets.js';

export type ProjectPrefixOptions = {
  projectPrefix?: string;
};

export type CreateNodesOptions = DynamicTargetOptions & ProjectPrefixOptions;

export type ProjectConfigurationWithName = WithRequired<
  ProjectConfiguration,
  'name'
>;

export type NormalizedCreateNodesContext = (
  | CreateNodesContext
  | CreateNodesContextV2
) & {
  projectJson: ProjectConfigurationWithName;
  projectRoot: string;
  createOptions: CreateNodesOptions;
};

export type NormalizedCreateNodesContextV2 = CreateNodesContextV2 &
  CreateTargetsOptions;
