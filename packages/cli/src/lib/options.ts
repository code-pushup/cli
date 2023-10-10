import { yargsGlobalOptionsDefinition } from './implementation/global-options';
import { yargsCoreConfigOptionsDefinition } from './implementation/core-config-options';

export const options = {
  ...yargsGlobalOptionsDefinition(),
  ...yargsCoreConfigOptionsDefinition(),
};
