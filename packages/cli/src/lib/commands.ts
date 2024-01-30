import { CommandModule } from 'yargs';
import { yargsAutorunCommandObject } from './autorun/autorun-command';
import { yargsCollectCommandObject } from './collect/collect-command';
import { yargsConfigCommandObject } from './print-config/print-config-command';
import { yargsUploadCommandObject } from './upload/upload-command';

export const commands: CommandModule[] = [
  yargsAutorunCommandObject(),
  yargsCollectCommandObject(),
  yargsUploadCommandObject(),
  yargsConfigCommandObject(),
];
