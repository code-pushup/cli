import { CoreConfig, GlobalOptions } from '@code-pushup/models';

export type CommandBaseOptions = Omit<GlobalOptions, 'configPath'> & CoreConfig;
