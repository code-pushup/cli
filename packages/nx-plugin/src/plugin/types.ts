import type { CreateNodesContext, ProjectConfiguration } from '@nx/devkit';
import { DynamicTargetOptions } from '../internal/types';

export type CreateNodesOptions = DynamicTargetOptions;

export type NormalizedCreateNodesContext = CreateNodesContext & {
  projectJson: ProjectConfiguration;
  projectRoot: string;
  createOptions: CreateNodesOptions;
};
