import { AuditOutputs } from '@code-pushup/models';

export type RunnerResult = {
  date: string;
  duration: number;
  audits: AuditOutputs;
};
