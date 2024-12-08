import type { CommandModule } from 'yargs';
import { yargsAutorunCommandObject } from './autorun/autorun-command.js';
import { yargsCollectCommandObject } from './collect/collect-command.js';
import { yargsCompareCommandObject } from './compare/compare-command.js';
import { yargsHistoryCommandObject } from './history/history-command.js';
import { yargsMergeDiffsCommandObject } from './merge-diffs/merge-diffs-command.js';
import { yargsConfigCommandObject } from './print-config/print-config-command.js';
import { yargsUploadCommandObject } from './upload/upload-command.js';

export const commands: CommandModule[] = [
  {
    ...yargsAutorunCommandObject(),
    command: '*',
  },
  yargsAutorunCommandObject(),
  yargsCollectCommandObject(),
  yargsUploadCommandObject(),
  yargsHistoryCommandObject(),
  yargsCompareCommandObject(),
  yargsConfigCommandObject(),
  yargsMergeDiffsCommandObject(),
];
