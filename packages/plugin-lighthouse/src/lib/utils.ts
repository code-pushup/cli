import { type CliFlags } from 'lighthouse';
import Details from 'lighthouse/types/lhr/audit-details';
import { Result } from 'lighthouse/types/lhr/audit-result';
import {
  Audit,
  AuditDetails,
  AuditOutput,
  AuditOutputs,
} from '@code-pushup/models';
import { objectToCliArgs, toArray } from '@code-pushup/utils';
import { LIGHTHOUSE_REPORT_NAME } from './constants';

type RefinedLighthouseOption = {
  url: CliFlags['_'];
  chromeFlags?: Record<CliFlags['chromeFlags'][number], string>;
};
export type LighthouseCliOptions = RefinedLighthouseOption &
  Partial<Omit<CliFlags, keyof RefinedLighthouseOption>>;

export function getLighthouseCliArguments(
  options: LighthouseCliOptions,
): string[] {
  const {
    url,
    outputPath = LIGHTHOUSE_REPORT_NAME,
    onlyAudits = [],
    output = 'json',
    verbose = false,
    chromeFlags = {},
  } = options;

  // eslint-disable-next-line functional/no-let
  let argsObj: Record<string, unknown> = {
    _: ['lighthouse', url.join(',')],
    verbose,
    output,
    'output-path': outputPath,
  };

  if (onlyAudits != null && onlyAudits.length > 0) {
    argsObj = {
      ...argsObj,
      onlyAudits,
    };
  }

  // handle chrome flags
  if (Object.keys(chromeFlags).length > 0) {
    argsObj = {
      ...argsObj,
      chromeFlags: Object.entries(chromeFlags)
        .map(([key, value]) => `--${key}=${value}`)
        .join(' '),
    };
  }

  return objectToCliArgs(argsObj);
}

export class AuditsNotImplementedError extends Error {
  constructor(auditSlugs: string[]) {
    super(`audits: "${auditSlugs.join(', ')}" not implemented`);
  }
}

export function validateOnlyAudits(
  audits: Audit[],
  onlyAudits: string | string[],
): audits is Audit[] {
  const missingAudtis = toArray(onlyAudits).filter(
    slug => !audits.some(audit => audit.slug === slug),
  );
  if (missingAudtis.length > 0) {
    throw new AuditsNotImplementedError(missingAudtis);
  }
  return true;
}

type UnsupportedDetail =
  | Details.CriticalRequestChain
  | Details.List
  | Details.TreemapData
  | Details.Screenshot
  | Details.Filmstrip
  | Details.DebugData;
type UnsupportedDetailTypes = UnsupportedDetail['type'];

export function toAuditOutputs(lhrAudits: Result[]): AuditOutputs {
  return Object.values(lhrAudits).map(
    ({
      id: slug,
      score,
      numericValue: value = 0, // not every audit has a numericValue
      details,
      displayValue,
    }: Result) => {
      const auditOutput: AuditOutput = {
        slug,
        score: score ?? 1, // score can be null
        value,
        displayValue,
      };

      if (details == null) {
        return auditOutput;
      } else {
        const type = details.type;
        switch (type) {
          case 'opportunity':
            return {
              ...auditOutput,
              details: opportunityToDetails(details),
            };
          case 'table':
            return {
              ...auditOutput,
              details: tableToDetails(details),
            };
          default:
            const unsupportedType: UnsupportedDetailTypes = type;
            console.info(
              `Parsing details from type ${unsupportedType} is not implemented.`,
            );
            return auditOutput;
        }
      }
    },
  );
}

export function tableToDetails(tableDetails: Details.Table): AuditDetails {
  const headings = tableDetails.headings.map(({ key }) => key || '');
  return {
    issues: [
      {
        message: headings.length > 0 ? headings.join(', ') : 'no data present',
        severity: 'info',
      },
    ],
  };
}

export function opportunityToDetails(
  opportunityDetails: Details.Opportunity,
): AuditDetails {
  return {
    issues: [
      {
        message: opportunityDetails.headings.map(({ key }) => key).join(', '),
        severity: 'info',
      },
    ],
  };
}
