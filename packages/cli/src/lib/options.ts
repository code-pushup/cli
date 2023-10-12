import { yargsGlobalOptionsDefinition } from './implementation/general-cli-options';
import { yargsCoreConfigOptionsDefinition } from './implementation/core-config-cli-options';

export const options = {
  ...yargsGlobalOptionsDefinition(),
  ...yargsCoreConfigOptionsDefinition(),
};
