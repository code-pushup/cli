import {describe, expect, it} from 'vitest';
import {toAuditOutputs} from "./knip.plugin";
import {main} from "knip";


describe('toAuditOutputs', () => {
  it('should return correct audit and issues for unused files', () => {
      expect(toAuditOutputs({
        files: new Set(['unused-file.ts']),
        issues: []
      } as any)).toEqual(expect.arrayContaining([
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


describe('getReport', () => {
  it('should return correct audit and issues for unused files', () => {
      expect(main({
        cwd: 'tmp',
        isFix:true,
      })).toEqual(expect.arrayContaining([
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
