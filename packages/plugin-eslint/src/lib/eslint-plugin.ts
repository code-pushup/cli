import { ESLint } from 'eslint';

type ESLintPluginConfig = {
  config: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function eslintPlugin({ config }: ESLintPluginConfig) {
  return {
    name: 'eslint',
    version: ESLint.version,
  };
}
