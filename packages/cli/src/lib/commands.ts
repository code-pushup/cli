import type { CommandModule } from 'yargs';
import { yargsAutorunCommandObject } from './autorun/autorun-command';
import { yargsCollectCommandObject } from './collect/collect-command';
import { yargsCompareCommandObject } from './compare/compare-command';
import { yargsHistoryCommandObject } from './history/history-command';
import { yargsMergeDiffsCommandObject } from './merge-diffs/merge-diffs-command';
import { yargsConfigCommandObject } from './print-config/print-config-command';
import { yargsUploadCommandObject } from './upload/upload-command';

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
