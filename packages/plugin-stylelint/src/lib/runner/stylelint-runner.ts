import stylelint, { type LinterOptions, getConfigForFile } from 'stylelint';

// Run Stylelint Programmatically
export async function lintStyles(opt: Omit<LinterOptions, 'formatter'>) {
  console.log('Stylelint props:', Object.keys(stylelint));

  const _linter = stylelint._createLinter(opt);
  //console.log('Stylelint._createLinter:', Object.keys(_linter));
  //console.log('Stylelint._createLinter._extendExplorer:', _linter._extendExplorer);
  //console.log('Stylelint._createLinter._extendExplorer.load():', await _linter._extendExplorer.load(opt.configFile ?? ''));
  console.log('Stylelint._createLinter.resolveConfig:', await getConfigForFile(opt.configFile ?? '', {
    configFile: opt.configFile,
    configBasedir: opt.configBasedir,
    config: opt.config,
    cwd: opt.cwd,
  }));


  try {
    // eslint-disable-next-line functional/immutable-data
    globalThis.console.assert = globalThis.console.assert || (() => {});
    const { results } = await stylelint.lint({
      ...opt,
      formatter: 'json',
    });
    return results;
  } catch (error) {
    throw new Error('Error while linting: ' + error);
  }
}
