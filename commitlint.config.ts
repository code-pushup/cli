import config from '@commitlint/config-conventional';
import { RuleConfigSeverity, type UserConfig } from '@commitlint/types';
import { getProjects } from '@nx/devkit';
import { FsTree } from 'nx/src/generators/tree';

const projects = getProjects(new FsTree(process.cwd(), false));
const scopes = [
  ...[...projects]
    .filter(
      ([, { projectType }]) =>
        projectType === 'library' || projectType === 'application',
    )
    .map(([name]) => name),
  'tools',
  'workflows',
  'testing',
].sort();

const configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  plugins: ['commitlint-plugin-tense'],
  rules: {
    'scope-enum': [RuleConfigSeverity.Error, 'always', scopes],
    'type-enum': () => {
      const defaultTypes = config.rules['type-enum'][2];
      const types = [
        ...defaultTypes,
        'release', // custom type for release commits
      ];
      return [RuleConfigSeverity.Error, 'always', types];
    },
    'tense/subject-tense': [
      RuleConfigSeverity.Error,
      'always',
      { firstOnly: true, allowedTenses: ['present-imperative'] },
    ],
  },
};

module.exports = configuration;
