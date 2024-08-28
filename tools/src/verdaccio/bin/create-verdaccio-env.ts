import yargs, { Options } from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  type StartVerdaccioAndSetupEnvOptions,
  startVerdaccioAndSetupEnv,
} from '../env';

const argv = yargs(hideBin(process.argv))
  .version(false)
  .options({
    verbose: { type: 'boolean' },
    projectName: { type: 'string', demandOption: true },
    port: { type: 'string' },
  } satisfies Partial<Record<keyof StartVerdaccioAndSetupEnvOptions, Options>>).argv;

(async () => {
  await startVerdaccioAndSetupEnv(argv as StartVerdaccioAndSetupEnvOptions);
  process.exit(0);
})();
