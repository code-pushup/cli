import { CommandModule } from 'yargs';
import { yargsCollectCommandObject } from './collect/command-object';

export const commands: CommandModule[] = [yargsCollectCommandObject()];
