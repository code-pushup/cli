const { RuleConfigSeverity } = require('@commitlint/types');
const {
  utils: { getProjects },
} = require('@commitlint/config-nx-scopes');

/** @type {import('@commitlint/types').UserConfig} */
const configuration = {
  extends: ['@commitlint/config-conventional'],
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
  },
};

module.exports = configuration;
