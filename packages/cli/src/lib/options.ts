import {
  yargsCoreConfigOptionsDefinition,
  yargsPersistConfigOptionsDefinition,
  yargsUploadConfigOptionsDefinition,
} from './implementation/core-config.options';
import { yargsFilterOptionsDefinition } from './implementation/filter.options';
import { yargsGlobalOptionsDefinition } from './implementation/global.options';

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
  'Persist Options:': Object.keys(yargsPersistConfigOptionsDefinition()),
  'Upload Options:': Object.keys(yargsUploadConfigOptionsDefinition()),
};
