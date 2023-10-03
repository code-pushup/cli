import { CoreConfig, GlobalOptions } from '@quality-metrics/models';

export type CommandBaseOptions = Omit<GlobalOptions, 'configPath'> & CoreConfig;
