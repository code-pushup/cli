import { yargsCoreConfigOptionsDefinition } from './implementation/core-config.options';
import { yargsGlobalOptionsDefinition } from './implementation/global.options';

export const options = {
  ...yargsGlobalOptionsDefinition(),
  ...yargsCoreConfigOptionsDefinition(),
};
