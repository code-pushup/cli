import { collect, CollectOptions, persistReport } from '@quality-metrics/utils';
import { writeFile } from 'fs/promises';
import { CommandModule } from 'yargs';

export function yargsCollectCommandObject() {
  const handler = async (
    config: CollectOptions & { format: string },
  ): Promise<void> => {
    const report = await collect(config);

    const { persist } = config;
    persistReport({
      ...persist,
      report,
      config,
    });

    await writeFile(persist.outputPath, JSON.stringify(report, null, 2));
  };

  return {
    command: 'collect',
    describe: 'Run Plugins and collect results',
    handler: handler as unknown as CommandModule['handler'],
  } satisfies CommandModule;
}
