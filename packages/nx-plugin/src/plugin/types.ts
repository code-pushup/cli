import type {
  CreateNodesContext,
  CreateNodesContextV2,
  ProjectConfiguration,
} from '@nx/devkit';
import type { WithRequired } from '@code-pushup/utils';
import type { DynamicTargetOptions } from '../internal/types';
import type { CreateTargetsOptions } from './target/targets';

export type ProjectPrefixOptions = {
  projectPrefix?: string;
};

export type CreateNodesOptions = DynamicTargetOptions & ProjectPrefixOptions;

export type ProjectConfigurationWithName = WithRequired<
  ProjectConfiguration,
  'name'
>;

export type NormalizedCreateNodesContext = CreateNodesContext &
  CreateTargetsOptions;

export type NormalizedCreateNodesV2Context = CreateNodesContextV2 &
  CreateTargetsOptions;
