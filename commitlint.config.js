const { RuleConfigSeverity } = require('@commitlint/types');
const {
  utils: { getProjects },
} = require('@commitlint/config-nx-scopes');

/** @type {import('@commitlint/types').UserConfig} */
const configuration = {
  extends: ['@commitlint/config-conventional'],
  plugins: ['@ngx-devs/commitlint-plugin-imperative'],
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
    'imperative-rule/en': [RuleConfigSeverity.Error, 'always'],
  },
};

module.exports = configuration;
