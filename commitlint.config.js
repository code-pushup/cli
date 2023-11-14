const { RuleConfigSeverity } = require('@commitlint/types');
const {
  utils: { getProjects },
} = require('@commitlint/config-nx-scopes');

/** @type {import('@commitlint/types').UserConfig} */
const configuration = {
  extends: ['@commitlint/config-conventional'],
  plugins: ['commitlint-plugin-tense'],
  rules: {
    'scope-enum': async ctx => {
      const projects = await getProjects(
        ctx,
        ({ name, projectType, tags }) =>
          projectType === 'library' || projectType === 'application',
      );
      const scopes = [...projects, 'tools', 'workflows', 'testing'].sort();
      return [RuleConfigSeverity.Error, 'always', scopes];
    },
    'tense/subject-tense': [
      RuleConfigSeverity.Error,
      'always',
      { firstOnly: true, allowedTenses: ['present-imperative'] },
    ],
  },
};

module.exports = configuration;
