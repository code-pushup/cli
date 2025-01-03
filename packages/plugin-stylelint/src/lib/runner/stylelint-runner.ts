import stylelint, { type LinterOptions, getConfigForFile } from 'stylelint';

// Run Stylelint Programmatically
export async function lintStyles({config, ...options}: Omit<LinterOptions, 'formatter'>) {
  console.log('Stylelint props:', Object.keys(stylelint));

  //console.log('Stylelint._createLinter:', Object.keys(_linter));
  //console.log('Stylelint._createLinter._extendExplorer:', _linter._extendExplorer);
  //console.log('Stylelint._createLinter._extendExplorer.load():', await _linter._extendExplorer.load(opt.configFile ?? ''));
  const _linter = stylelint._createLinter(options);
  const results = await getConfigForFile(_linter, options.configFile ?? '')
  console.log('Stylelint._createLinter.resolveConfig:', results.config);


  try {
    // eslint-disable-next-line functional/immutable-data
    globalThis.console.assert = globalThis.console.assert || (() => {});
    const { results } = await stylelint.lint({
      ...options,
      formatter: 'json',
    });
    return results;
  } catch (error) {
    throw new Error('Error while linting: ' + error);
  }
}
