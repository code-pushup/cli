import { collect, CollectOptions } from '@quality-metrics/utils';
import { writeFile } from 'fs/promises';
import { CommandModule } from 'yargs';

export function yargsCollectCommandObject() {
  const handler = async (args: CollectOptions): Promise<void> => {
    const collectOutput = await collect(args);

    const { persist } = args;
    await writeFile(persist.outputPath, JSON.stringify(collectOutput, null, 2));
  };

  return {
    command: 'collect',
    describe: 'Run Plugins and collect results',
    handler: handler as unknown as CommandModule['handler'],
  } satisfies CommandModule;
}
