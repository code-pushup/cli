import type {
  AuditOutput,
  CoreConfig,
  PluginConfig,
  RunnerConfig,
  RunnerFunction,
} from '@code-pushup/models';

// Note: In order for the runner to not expect an actual file, set up fs mocks
// Then add output.json to the in-memory file system and customise content as needed
export const MINIMAL_RUNNER_CONFIG_MOCK: RunnerConfig = {
  command: 'node',
  args: ['-v'],
  outputFile: 'output.json',
};

export const MINIMAL_RUNNER_FUNCTION_MOCK: RunnerFunction = () => [
  {
    slug: 'node-version',
    score: 0.3,
    value: 16,
    displayValue: '16.0.0',
    details: {
      issues: [
        {
          severity: 'error',
          message: 'The required Node version to run Code PushUp CLI is 18.',
        },
      ],
    },
  } satisfies AuditOutput,
];

export const MINIMAL_PLUGIN_CONFIG_MOCK: PluginConfig = {
  slug: 'node',
  title: 'Node',
  icon: 'javascript',
  audits: [
    {
      slug: 'node-version',
      title: 'Node version',
      description: 'Returns node version',
      docsUrl: 'https://nodejs.org/',
    },
  ],
  runner: MINIMAL_RUNNER_FUNCTION_MOCK,
};

export const MINIMAL_CONFIG_MOCK: CoreConfig = {
  plugins: [MINIMAL_PLUGIN_CONFIG_MOCK],
};

export const MINIMAL_HISTORY_CONFIG_MOCK: CoreConfig = {
  persist: {
    outputDir: '.code-pushup',
    filename: 'history-report',
    format: ['json'],
  },
  plugins: [MINIMAL_PLUGIN_CONFIG_MOCK],
};
