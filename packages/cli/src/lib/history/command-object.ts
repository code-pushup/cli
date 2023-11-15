import { CommandModule } from 'yargs';
import { Report } from '@code-pushup/models';
import {
  getCurrentBranchOrTag,
  git,
  guardAgainstDirtyRepo,
} from '@code-pushup/utils';

export function yargsHistoryCommandObject() {
  const command = 'history';
  return {
    command,
    describe: 'Create history of commits',
    handler: async args => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _, $0, ...config } = args;

      await guardAgainstDirtyRepo();

      const current = await getCurrentBranchOrTag();
      console.log('Current Branch:', current);

      const tags = await git.tags();
      console.log('Tags:', tags.all);

      const log = await git.log();
      console.log('All Log:', log.all.length);

      const commitsToAudit = log.all
        .map(({ hash }) => hash)
        // crawl from oldest to newest
        .reverse();

      const reports: Report[] = [];
      for (const commit of commitsToAudit) {
        await git.checkout(commit);
        const activeBranch = await getCurrentBranchOrTag();
        console.log('Current Branch:', activeBranch);

        const report = { activeBranch }; // await yargsAutorunCommandObject().handler(config as any);
        reports.push(report as any as Report);

        // ensureCleanGit
      }

      await git.checkout(current);
      console.log('Current Branch:', current);
      console.log('Reports:', reports);
    },
  } satisfies CommandModule;
}
