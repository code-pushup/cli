import {
  yargsCoreConfigOptionsDefinition,
  yargsPersistConfigOptionsDefinition,
  yargsUploadConfigOptionsDefinition,
} from './implementation/core-config.options';
import { yargsGlobalOptionsDefinition } from './implementation/global.options';
import { yargsOnlyPluginsOptionsDefinition } from './implementation/only-plugins.options';
import { yargsSkipPluginsOptionsDefinition } from './implementation/skip-plugins.options';

export const options = {
  ...yargsGlobalOptionsDefinition(),
  ...yargsCoreConfigOptionsDefinition(),
  ...yargsOnlyPluginsOptionsDefinition(),
  ...yargsSkipPluginsOptionsDefinition(),
};

export const groups = {
  'Global Options:': [
    ...Object.keys(yargsGlobalOptionsDefinition()),
    ...Object.keys(yargsOnlyPluginsOptionsDefinition()),
    ...Object.keys(yargsSkipPluginsOptionsDefinition()),
  ],
  'Persist Options:': Object.keys(yargsPersistConfigOptionsDefinition()),
  'Upload Options:': Object.keys(yargsUploadConfigOptionsDefinition()),
};
