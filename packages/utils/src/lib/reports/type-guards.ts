import type {
  FileIssue,
  Issue,
  IssueSource,
  SourceFileLocation,
  SourceUrlLocation,
  UrlIssue,
} from '@code-pushup/models';

/** Type guard for file-based source */
export function isFileSource(
  source: IssueSource,
): source is SourceFileLocation {
  return 'file' in source;
}

/** Type guard for URL-based source */
export function isUrlSource(source: IssueSource): source is SourceUrlLocation {
  return 'url' in source;
}

/** Type guard for issue with file source */
export function isFileIssue(issue: Issue): issue is FileIssue {
  return issue.source != null && isFileSource(issue.source);
}

/** Type guard for issue with URL source */
export function isUrlIssue(issue: Issue): issue is UrlIssue {
  return issue.source != null && isUrlSource(issue.source);
}
