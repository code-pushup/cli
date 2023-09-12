import { NEW_LINE } from './constants';

/**
 * <details {open}>
 *   <summary>{title}</summary>
 *   {content}
 * <details>
 */
export function details(
  title: string,
  content: string,
  cfg: { open: boolean } = { open: false },
): string {
  return `<details${cfg.open ? ' open' : ''}>${NEW_LINE}
<summary>${title}</summary>${NEW_LINE}
${content}${NEW_LINE}
</details>${NEW_LINE}`;
}
