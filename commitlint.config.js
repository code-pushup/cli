const { RuleConfigSeverity } = require('@commitlint/types');
const {
  utils: { getProjects },
} = require('@commitlint/config-nx-scopes');

/** @type {import('@commitlint/types').UserConfig} */
const configuration = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': async ctx => {
      const scopes = await getProjects(
        ctx,
        ({ name, projectType, tags }) =>
          projectType === 'library' || projectType === 'application',
      );
      return [RuleConfigSeverity.Error, 'always', scopes];
    },
  },
};

module.exports = configuration;
