import {
  MAX_DESCRIPTION_LENGTH,
  MAX_ISSUE_MESSAGE_LENGTH,
  MAX_TITLE_LENGTH,
} from '@code-pushup/models';

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+|\//g, '-')
    .replace(/[^a-z\d-]/g, '');
}

export function pluralize(text: string): string {
  if (text.endsWith('y')) {
    return `${text.slice(0, -1)}ies`;
  }
  if (text.endsWith('s')) {
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
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(positiveBytes) / Math.log(k));

  return `${Number.parseFloat((positiveBytes / Math.pow(k, i)).toFixed(dm))} ${
    sizes[i]
  }`;
}

export function pluralizeToken(token: string, times = 0): string {
  return `${times} ${Math.abs(times) === 1 ? token : pluralize(token)}`;
}

export function formatDuration(duration: number): string {
  if (duration < 1000) {
    return `${duration} ms`;
  }
  return `${(duration / 1000).toFixed(2)} s`;
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

export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  const ellipsis = '...';
  return text.slice(0, maxChars - ellipsis.length) + ellipsis;
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
