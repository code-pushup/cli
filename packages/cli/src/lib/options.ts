import {
  yargsCoreConfigOptionsDefinition,
  yargsPersistConfigOptionsDefinition,
  yargsUploadConfigOptionsDefinition,
} from './implementation/core-config.options';
import { yargsGlobalOptionsDefinition } from './implementation/global.options';
import { yargsOnlyPluginsOptionsDefinition } from './implementation/only-plugins.options';

export const options = {
  ...yargsGlobalOptionsDefinition(),
  ...yargsCoreConfigOptionsDefinition(),
  ...yargsOnlyPluginsOptionsDefinition(),
};

export const groups = {
  'Global Options:': [
    ...Object.keys(yargsGlobalOptionsDefinition()),
    ...Object.keys(yargsOnlyPluginsOptionsDefinition()),
  ],
  'Persist Options:': Object.keys(yargsPersistConfigOptionsDefinition()),
  'Upload Options:': Object.keys(yargsUploadConfigOptionsDefinition()),
};
