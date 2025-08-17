import type Details from 'lighthouse/types/lhr/audit-details';
import type {
  AuditDetails,
  BasicTree,
  BasicTreeNode,
  Table,
} from '@code-pushup/models';
import { formatBytes, formatDuration } from '@code-pushup/utils';

const DURATION_DECIMALS = 3;

export function parseCriticalRequestChainToAuditDetails(
  details: Details.CriticalRequestChain,
): AuditDetails {
  const trees = chainsToTrees(details);
  const table = longestChainToTable(details);
  return { table, trees };
}

function longestChainToTable(details: Details.CriticalRequestChain): Table {
  const longestChain = {
    duration: formatDuration(details.longestChain.duration, DURATION_DECIMALS),
    transferSize: formatBytes(details.longestChain.transferSize),
    length: details.longestChain.length,
  };
  type ColumnKey = keyof typeof longestChain;

  return {
    title: 'Longest chain',
    columns: [
      {
        key: 'duration' satisfies ColumnKey,
        label: 'Duration',
        align: 'right',
      },
      {
        key: 'transferSize' satisfies ColumnKey,
        label: 'Transfer size',
        align: 'right',
      },
      {
        key: 'length' satisfies ColumnKey,
        label: 'Length',
        align: 'right',
      },
    ],
    rows: [longestChain],
  };
}

function chainsToTrees(details: Details.CriticalRequestChain): BasicTree[] {
  return Object.values(details.chains)
    .map(chainToTreeNode)
    .map(root => ({ type: 'basic', root }));
}

function chainToTreeNode(
  chain: Details.SimpleCriticalRequestNode[string],
): BasicTreeNode {
  return {
    name: chain.request.url,
    values: {
      duration: formatDuration(
        (chain.request.endTime - chain.request.startTime) * 1000,
        DURATION_DECIMALS,
      ),
      transferSize: formatBytes(chain.request.transferSize),
    },
    ...(chain.children && {
      children: Object.values(chain.children).map(chainToTreeNode),
    }),
  };
}
