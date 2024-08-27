import yargs, { Options } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { nxStartVerdaccioAndSetupEnv } from '../env';
import { NxStarVerdaccioOptions } from '../registry';

const argv = yargs(hideBin(process.argv))
  .version(false)
  .options({
    verbose: { type: 'boolean' },
    projectName: { type: 'string', demandOption: true },
    port: { type: 'string' },
  } satisfies Partial<Record<keyof NxStarVerdaccioOptions, Options>>).argv;

(async () => {
  const registryResult = await nxStartVerdaccioAndSetupEnv(argv as any);
  process.exit(0);
})();
