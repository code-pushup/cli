import { CommandModule } from 'yargs';
import { writeFile } from 'fs/promises';
import { collect, CollectOptions } from '@quality-metrics/utils';
import { Report } from '@quality-metrics/models';

export function yargsCollectCommandObject() {
  const handler = async (args: CollectOptions): Promise<void> => {

    console.log('audits:: ', args.plugins?.[0]?.audits);
    console.log('runner:: ', args.plugins?.[0]?.runner);

    let collectOutput: Report = {} as Report;
 try {
      collectOutput = await collect(args);
    } catch (e) {
      console.error((e as Error).message); // @TODO discuss DX for errors
     // throw new Error((e as Error).message);
    }

    try {
      const { persist } = args;
      await writeFile(
        persist.outputPath,
        JSON.stringify(collectOutput as unknown),
      );
     // process.exit(0); // @TODO think about process.exit usage and benefits
    } catch (e) {
      console.error((e as Error).message); // @TODO discuss DX for errors
     // throw new Error((e as Error).message);
    }
  };

  return {
    command: 'collect',
    describe: 'Run Plugins and collect results',
    handler: handler as unknown as CommandModule['handler'],
  } satisfies CommandModule;
}
