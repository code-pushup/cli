import stylelint, {getConfigForFile, type LinterOptions} from "stylelint";
import path from "node:path";
import * as process from "node:process";

export function getNormalizedConfigForFile(options: LinterOptions) {
  const _linter = stylelint._createLinter(options);
  const configFile = options.configFile ?? path.join(options?.cwd ?? process.cwd(), '.stylelintrc.json');
  return getConfigForFile(_linter, configFile);
}

