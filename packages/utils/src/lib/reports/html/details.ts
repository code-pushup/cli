import { NEW_LINE } from '../md';

/**
 * <details {open}>
 *   <summary>{title}</summary>
 *
 *   {content}
 *
 * <details>
 */
export function details(
  title: string,
  content: string,
  cfg: { open: boolean } = { open: false },
): string {
  return `<details${
    cfg.open ? ' open' : ''
  }>${NEW_LINE}<summary>${title}</summary>${NEW_LINE}${NEW_LINE}${content}${NEW_LINE}${NEW_LINE}</details>${NEW_LINE}`;
}
