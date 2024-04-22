import {AuditDetails, TableAlignment, TableRow, tableSchema} from "@code-pushup/models";
import Details from "lighthouse/types/lhr/audit-details";
import {formatBytes, formatDuration, normalizeTable} from "@code-pushup/utils";
import {parseType} from "./types";
import chalk from "chalk";

export function parseOpportunityDetails(details: Details.Opportunity): AuditDetails {
  const {headings: rawHeadings, items} = details as Details.Opportunity;

  if (items.length == 0) {
    return {};
  }
  const result = tableSchema().safeParse(normalizeTable({
    headings: rawHeadings.map(({key, label}) => ({
      key: key ?? '',
      label: typeof label === 'string' ? label : undefined,
    })),
    alignment: ('l').repeat(rawHeadings.length).split('')
      .map((v, idx) => idx === 1 ? 'c' : v) as TableAlignment[],
    rows: items.map((row, rowIxd) => {
      const { wastedPercent, ...rawDetails} = row;
      return {
        ...(wastedPercent && {wastedPercent: `${Number(wastedPercent).toFixed(2)} %`}),
        ...Object.fromEntries(Object.entries(rawDetails).filter(i => Boolean(i.at(1))).map(([key, value]) => ([key, parseType(value as Record<string, any>, rawHeadings?.at(rowIxd))])))
      } satisfies TableRow;
    })
  }));
  if (result.success) {
    return {
      table: result.data
    }
  }
  throw new Error(`Parsing details ${chalk.bold('opportunities')} failed: \n${result.error.toString()}`);
}
