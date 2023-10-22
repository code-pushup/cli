import chalk from 'chalk';
import cliui from 'cliui';
import { NEW_LINE } from './md';
import { ScoredReport } from './scoring';
import {
  countWeightedRefs,
  reportHeadlineText,
  reportOverviewTableHeaders,
  sumRefs,
} from './utils';

const ui = cliui({ width: 60 }); // @TODO check display width

export function reportToStdout(report: ScoredReport): void {
  reportToHeaderSection(report);
  reportToMetaSection(report);
  console.log(NEW_LINE);
  reportToOverviewSection(report);
  console.log(NEW_LINE);
  reportToDetailSection(report);
  console.log(NEW_LINE);
  console.log('Made with ❤️ by code-pushup.dev');
}

function reportToHeaderSection(report: ScoredReport): void {
  const { packageName, version } = report;
  console.log(`${chalk.bold(reportHeadlineText)} - ${packageName}@${version}`);
}

function reportToMetaSection(report: ScoredReport): void {
  const { date, duration, version, packageName, plugins } = report;
  const _print = (text: string) => console.log(chalk.italic(chalk.gray(text)));

  _print(`---`);
  _print(`Package Name: ${packageName}`);
  _print(`Version: ${version}`);
  _print(
    `Commit: feat(cli): add logic for markdown report - 7eba125ad5643c2f90cb21389fc3442d786f43f9`,
  );
  _print(`Date: ${new Date(date).toString()}`);
  _print(`Duration: ${duration}ms`);
  _print(`Plugins: ${plugins?.length}`);
  _print(
    `Audits: ${plugins?.reduce((sum, { audits }) => sum + audits.length, 0)}`,
  );
  _print(`---`);
}

function reportToOverviewSection(report: ScoredReport): void {
  const base = {
    width: 20,
    padding: [0, 1, 0, 1],
  };

  // table header
  ui.div(...reportOverviewTableHeaders.map(text => ({ text, ...base })));

  // table content
  report.categories.forEach(({ title, refs }) => {
    const score = sumRefs(refs).toString();
    const audits = `${refs.length.toString()}/${countWeightedRefs(refs)}`;

    ui.div(
      {
        text: `${title}`,
        ...base,
      },
      {
        text: score,
        ...base,
      },
      {
        text: audits,
        ...base,
      },
    );
  });

  console.log(ui.toString());
}

function reportToDetailSection(report: ScoredReport): void {
  const { categories, plugins } = report;

  categories.forEach(category => {
    const { title, refs } = category;

    console.log(chalk.bold(`${title} ${sumRefs(refs)}`));

    refs.forEach(
      ({ slug: auditSlugInCategoryRefs, weight, plugin: pluginSlug }) => {
        const audit = plugins
          .find(({ slug }) => slug === pluginSlug)
          ?.audits.find(
            ({ slug: auditSlugInPluginAudits }) =>
              auditSlugInPluginAudits === auditSlugInCategoryRefs,
          );

        if (audit) {
          let content = `${audit.description}` + NEW_LINE;
          if (audit.docsUrl) {
            content += `  ${audit.docsUrl} ${NEW_LINE}`;
          }
          console.log(`- ${audit.title} (${weight})`);
          console.log(`  ${content}`);
        } else {
          // this should never happen
          throw new Error(`No audit found for ${auditSlugInCategoryRefs}`);
        }
      },
    );
  });
}
