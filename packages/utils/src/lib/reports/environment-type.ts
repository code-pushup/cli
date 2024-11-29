import { type EnvironmentType, SUPPORTED_ENVIRONMENTS } from './types.js';

const environmentChecks: Record<EnvironmentType, () => boolean> = {
  vscode: () => process.env['TERM_PROGRAM'] === 'vscode',
  github: () => process.env['GITHUB_ACTIONS'] === 'true',
  gitlab: () => process.env['GITLAB_CI'] === 'true',
  other: () => true,
};

export function getEnvironmentType(): EnvironmentType {
  return (
    SUPPORTED_ENVIRONMENTS.find(env => environmentChecks[env]()) ?? 'other'
  );
}

export function getGitHubBaseUrl(): string {
  return `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/blob/${process.env['GITHUB_SHA']}`;
}

export function getGitLabBaseUrl(): string {
  return `${process.env['CI_SERVER_URL']}/${process.env['CI_PROJECT_PATH']}/-/blob/${process.env['CI_COMMIT_SHA']}`;
}
