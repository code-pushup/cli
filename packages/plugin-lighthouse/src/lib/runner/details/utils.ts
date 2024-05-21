import Details from 'lighthouse/types/lhr/audit-details';

export function parseNode(node?: Details.NodeValue): string {
  const { selector = '' } = node ?? {};
  return selector;
}
