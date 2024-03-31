import {describe, expect, it} from 'vitest';
import {auditSchema, coreConfigSchema, groupSchema, pluginConfigSchema} from '@code-pushup/models';
import {KNIP_AUDITS, KNIP_GROUP_FILES, KNIP_GROUP_EXPORTS, KNIP_GROUP_DEPENDENCIES, KNIP_GROUP_ALL} from './constants';
import knipPlugin from "./knip.plugin";


describe('constants-AUDITS', () => {
  it.each(KNIP_AUDITS.map(audit => [audit.slug, audit]))(
    'should be a valid %s audit meta info',
    (_, audit) => {
      expect(() => auditSchema.parse(audit)).not.toThrow();
    },
  );
});

describe('constants-KNIP_GROUPS', () => {
  it('should be a valid group meta info', () => {
      expect(() => groupSchema.parse(KNIP_GROUP_FILES)).not.toThrow();
    },
  );

  it('should be a valid group meta info', () => {
      expect(() => groupSchema.parse(KNIP_GROUP_EXPORTS)).not.toThrow();
    },
  );

  it('should be a valid group meta info', () => {
      expect(() => groupSchema.parse(KNIP_GROUP_DEPENDENCIES)).not.toThrow();
    },
  );

  it('should be a valid group meta info', () => {
      expect(() => groupSchema.parse(KNIP_GROUP_ALL)).not.toThrow();
    },
  );

  it('should be a valid group within the config', () => {
      expect(() => coreConfigSchema.parse({
        plugins: knipPlugin(),
        categories: [
          {
            slug: "category-1",
            title: 'category 1',
            refs: [
              KNIP_GROUP_ALL
            ]
          }
        ]
      })).not.toThrow();
    },
  );


});
