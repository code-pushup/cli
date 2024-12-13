import config from '@commitlint/config-conventional';
import nxScopes from '@commitlint/config-nx-scopes';
import { RuleConfigSeverity } from '@commitlint/types';

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  plugins: ['commitlint-plugin-tense'],
  rules: {
    'scope-enum': async ctx => {
      const projects = nxScopes.utils.getProjects(
        ctx,
        ({ projectType }) =>
          projectType === 'library' || projectType === 'application',
      );
      const scopes = [...projects, 'tools', 'workflows', 'testing'].sort();
      return [RuleConfigSeverity.Error, 'always', scopes];
    },
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
