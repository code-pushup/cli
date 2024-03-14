import {describe, expect, it} from 'vitest';
import {createAuditOutputFromKnipIssues} from "./utils";

describe('toAuditOutputs', () => {
  it('should return correct audit and issues for unused files', () => {
      expect(createAuditOutputFromKnipIssues('', [])).toEqual(expect.arrayContaining([
        {
          slug: 'unused-files',
          value: 1,
          displayValue: '1 unused files',
          score: 0,
          details: {
            issues: [
              {
                message: 'File unused-file.ts unused',
                severity: 'warning',
                source: {
                  file: 'unused-file.ts'
                }
              }
            ]
          }
        }
      ]));
    },
  );
});
