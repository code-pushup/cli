import { CommandModule } from 'yargs';
import { yargsCollectCommandObject } from './collect/command-object';
import {yargsUploadCommandObject} from "./upload/command-object";

export const commands: CommandModule[] = [
  {
    ...yargsCollectCommandObject(),
    command: '*',
  },
  yargsCollectCommandObject(),
  yargsUploadCommandObject()
];
