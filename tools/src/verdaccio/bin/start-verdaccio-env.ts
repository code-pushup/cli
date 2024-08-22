import * as process from 'process';
import yargs, { Options } from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  NxStarVerdaccioOptions,
  nxStartVerdaccioAndSetupEnv,
} from '../verdaccio';

const argv = yargs(hideBin(process.argv))
  .version(false)
  .options({
    verbose: { type: 'boolean' },
    projectName: { type: 'string', demandOption: true },
    storage: { type: 'string' },
    target: { type: 'string' },
    port: { type: 'string' },
  } satisfies Partial<Record<keyof NxStarVerdaccioOptions, Options>>).argv;

nxStartVerdaccioAndSetupEnv(argv as NxStarVerdaccioOptions);
