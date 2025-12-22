import ansis from 'ansis';
import stringWidth from 'string-width';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_ISSUE_MESSAGE_LENGTH,
  MAX_TITLE_LENGTH,
} from '@code-pushup/models';

export const UNICODE_ELLIPSIS = '…';

export function roundDecimals(value: number, maxDecimals: number) {
  const multiplier = Math.pow(10, maxDecimals);
  return Math.round(value * multiplier) / multiplier;
}

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+|\//g, '-')
    .replace(/[^a-z\d-]/g, '');
}

export function pluralize(text: string, amount?: number): string {
  if (amount != null && Math.abs(amount) === 1) {
    return text;
  }

  // best approximation of English pluralization "rules"
  // https://www.grammarly.com/blog/grammar/spelling-plurals-with-s-es/

  if (text.endsWith('y')) {
    return `${text.slice(0, -1)}ies`;
  }
  const suffixes = ['s', 'sh', 'ch', 'x', 'z'];
  if (suffixes.some(suffix => text.endsWith(suffix))) {
    return `${text}es`;
  }
  return `${text}s`;
}

export function formatBytes(bytes: number, decimals = 2) {
  const positiveBytes = Math.max(bytes, 0);

  // early exit
  if (positiveBytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const dm = Math.max(decimals, 0);
  const sizes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(positiveBytes) / Math.log(k));

  return `${roundDecimals(positiveBytes / Math.pow(k, i), dm)} ${sizes[i]}`;
}

export function pluralizeToken(token: string, times: number): string {
  return `${times} ${Math.abs(times) === 1 ? token : pluralize(token)}`;
}

export function formatDuration(ms: number, maxDecimals: number = 2): string {
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${roundDecimals(ms / 1000, maxDecimals)} s`;
}

export function formatDate(date: Date): string {
  const locale = 'en-US'; // fixed locale to ensure consistency across local defaults execution
  return date
    .toLocaleString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    .replace(/\u202F/g, ' '); // see https://github.com/nodejs/node/issues/45171
}

export function truncateText(
  text: string,
  options:
    | number
    | {
        maxChars: number;
        position?: 'start' | 'middle' | 'end';
        ellipsis?: string;
      },
): string {
  const {
    maxChars,
    position = 'end',
    ellipsis = UNICODE_ELLIPSIS,
  } = typeof options === 'number' ? { maxChars: options } : options;
  if (text.length <= maxChars) {
    return text;
  }

  const maxLength = maxChars - ellipsis.length;
  switch (position) {
    case 'start':
      return ellipsis + text.slice(-maxLength).trim();
    case 'middle':
      const halfMaxChars = Math.floor(maxLength / 2);
      return (
        text.slice(0, halfMaxChars).trim() +
        ellipsis +
        text.slice(-halfMaxChars).trim()
      );
    case 'end':
      return text.slice(0, maxLength).trim() + ellipsis;
  }
}

export function truncateTitle(text: string): string {
  return truncateText(text, MAX_TITLE_LENGTH);
}

export function truncateDescription(text: string): string {
  return truncateText(text, MAX_DESCRIPTION_LENGTH);
}

export function truncateIssueMessage(text: string): string {
  return truncateText(text, MAX_ISSUE_MESSAGE_LENGTH);
}

export function truncateMultilineText(
  text: string,
  options?: { ellipsis?: string },
): string {
  const { ellipsis = `[${UNICODE_ELLIPSIS}]` } = options ?? {};

  const crlfIndex = text.indexOf('\r\n');
  const lfIndex = text.indexOf('\n');
  const index = crlfIndex === -1 ? lfIndex : crlfIndex;

  if (index < 0) {
    return text;
  }

  const firstLine = text.slice(0, index);
  if (text.slice(index).trim().length === 0) {
    return firstLine;
  }
  return `${firstLine} ${ellipsis}`;
}

export function transformLines(
  text: string,
  fn: (line: string, index: number) => string,
): string {
  return text.split(/\r?\n/).map(fn).join('\n');
}

export function indentLines(text: string, identation: number): string {
  return transformLines(text, line => `${' '.repeat(identation)}${line}`);
}

export function serializeCommandWithArgs({
  command,
  args,
}: {
  command: string;
  args?: string[];
}): string {
  return [command, ...(args ?? [])].join(' ');
}

export function pluginMetaLogFormatter(
  title: string,
): (message: string) => string {
  const prefix = ansis.blue(`[${title}]`);
  const padding = ' '.repeat(stringWidth(prefix));
  return message =>
    transformLines(
      message,
      (line, idx) => `${idx === 0 ? prefix : padding} ${line}`,
    );
}

export function formatCoveragePercentage(stats: {
  covered: number;
  total: number;
}): string {
  const { covered, total } = stats;

  if (total === 0) {
    return '-';
  }

  const percentage = (covered / total) * 100;
  return `${percentage.toFixed(1)}%`;
}
