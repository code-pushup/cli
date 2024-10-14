import type { IdeEnvironment } from './types';

export function getEnvironmentType(): IdeEnvironment {
  if (isVSCode()) {
    return 'vscode';
  }
  if (isGitHub()) {
    return 'github';
  }
  return 'other';
}

function isVSCode(): boolean {
  return process.env['TERM_PROGRAM'] === 'vscode';
}

function isGitHub(): boolean {
  return process.env['GITHUB_ACTIONS'] === 'true';
}

export function getGitHubBaseUrl(): string {
  return `${process.env['GITHUB_SERVER_URL']}/${process.env['GITHUB_REPOSITORY']}/blob/${process.env['GITHUB_SHA']}`;
}
