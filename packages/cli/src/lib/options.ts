import {
  yargsCacheConfigOptionsDefinition,
  yargsCoreConfigOptionsDefinition,
  yargsPersistConfigOptionsDefinition,
  yargsUploadConfigOptionsDefinition,
} from './implementation/core-config.options.js';
import { yargsFilterOptionsDefinition } from './implementation/filter.options.js';
import { yargsGlobalOptionsDefinition } from './implementation/global.options.js';

export const options = {
  ...yargsGlobalOptionsDefinition(),
  ...yargsCoreConfigOptionsDefinition(),
  ...yargsFilterOptionsDefinition(),
};

export const groups = {
  'Global Options:': [
    ...Object.keys(yargsGlobalOptionsDefinition()),
    ...Object.keys(yargsFilterOptionsDefinition()),
  ],
  'Cache Options:': Object.keys(yargsCacheConfigOptionsDefinition()),
  'Persist Options:': Object.keys(yargsPersistConfigOptionsDefinition()),
  'Upload Options:': Object.keys(yargsUploadConfigOptionsDefinition()),
};
