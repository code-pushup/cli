import { readFileSync } from 'fs';
import { join } from 'path';

export const cpuNxPluginVersion = JSON.parse(
  readFileSync(join(__dirname, '../../package.json')).toString(),
).version;
export const cpuModelVersion = JSON.parse(
  readFileSync(join(__dirname, '../../../cli/package.json')).toString(),
).version;
export const cpuUtilsVersion = JSON.parse(
  readFileSync(join(__dirname, '../../../utils/package.json')).toString(),
).version;
export const cpuCliVersion = JSON.parse(
  readFileSync(join(__dirname, '../../../models/package.json')).toString(),
).version;
