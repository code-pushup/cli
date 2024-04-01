import { describe, expect, it } from 'vitest';
import { auditSchema, groupSchema } from '@code-pushup/models';
import {
  KNIP_AUDITS,
  KNIP_GROUP_ALL,
  KNIP_GROUP_DEPENDENCIES,
  KNIP_GROUP_EXPORTS,
  KNIP_GROUP_FILES,
} from './constants';

describe('constants-AUDITS', () => {
  it.each(KNIP_AUDITS.map(audit => [audit.slug, audit]))(
    'should be a valid %s audit meta info',
    (_, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
    },
  );
});

describe('constants-KNIP_GROUPS', () => {
  it('should be a valid file group info', () => {
    expect(() => groupSchema.parse(KNIP_GROUP_FILES)).not.toThrow();
  });

  it('should be a valid exports group info', () => {
    expect(() => groupSchema.parse(KNIP_GROUP_EXPORTS)).not.toThrow();
  });

  it('should be a valid dependencies group info', () => {
    expect(() => groupSchema.parse(KNIP_GROUP_DEPENDENCIES)).not.toThrow();
  });

  it('should be a valid all group info', () => {
    expect(() => groupSchema.parse(KNIP_GROUP_ALL)).not.toThrow();
  });
});
