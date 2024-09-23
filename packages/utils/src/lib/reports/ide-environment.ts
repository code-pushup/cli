import type { IdeEnvironment } from './types';

export function ideEnvironment(): IdeEnvironment {
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
