import { NEW_LINE } from '../constants.js';

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
  }>${NEW_LINE}<summary>${title}</summary>${NEW_LINE}${
    // ⚠️ The blank line is needed to ensure Markdown in content is rendered correctly.
    NEW_LINE
  }${content}${NEW_LINE}${
    // @TODO in the future we could consider adding it only if the content ends with a code block
    // ⚠️ The blank line ensure Markdown in content is rendered correctly.
    NEW_LINE
  }</details>${
    // ⚠️ The blank line is needed to ensure Markdown after details is rendered correctly.
    NEW_LINE
  }`;
}
