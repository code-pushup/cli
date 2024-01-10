import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '@code-pushup/models';

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+|\//g, '-')
    .replace(/[^a-z\d-]/g, '');
}

export function pluralize(text: string): string {
  if (text.endsWith('y')) {
    return text.slice(0, -1) + 'ies';
  }
  if (text.endsWith('s')) {
    return `${text}es`;
  }
  return `${text}s`;
}

export function formatBytes(bytes: number, decimals = 2) {
  bytes = Math.max(bytes, 0);
  // early exit
  if (!bytes) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function pluralizeToken(token: string, times: number = 0): string {
  return `${times} ${Math.abs(times) === 1 ? token : pluralize(token)}`;
}

export function formatDuration(duration: number): string {
  if (duration < 1000) {
    return `${duration} ms`;
  }
  return `${(duration / 1000).toFixed(2)} s`;
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
