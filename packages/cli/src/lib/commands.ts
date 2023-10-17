import { CommandModule } from 'yargs';
import { yargsAutorunCommandObject } from './autorun/command-object';
import { yargsCollectCommandObject } from './collect/command-object';
import { yargsUploadCommandObject } from './upload/command-object';

export const commands: CommandModule[] = [
  {
    ...yargsAutorunCommandObject(),
    command: '*',
  },
  yargsAutorunCommandObject(),
  yargsCollectCommandObject(),
  yargsUploadCommandObject(),
];
