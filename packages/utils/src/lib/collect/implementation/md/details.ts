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
  return `<details${cfg.open ? ' open' : ''}>
<summary>${title}</summary>
${content}
</details>
`;
}
