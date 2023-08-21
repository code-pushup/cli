import { ESLint } from 'eslint';

type ESLintPluginConfig = {
  config: string;
};

export function eslintPlugin({ config }: ESLintPluginConfig) {
  return {
    name: 'eslint',
    version: ESLint.version,
  };
}
