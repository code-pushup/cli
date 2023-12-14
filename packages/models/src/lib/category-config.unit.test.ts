import { describe, expect, it } from 'vitest';
import { coreConfigSchema } from '@code-pushup/models';
import { config } from '@code-pushup/models/testing';
import { categoryConfig } from '../../test/fixtures/categories.mock';
import { categoryConfigSchema } from './category-config';

describe('categoryConfigSchema', () => {
  it('should parse if configuration with valid audit and refs', () => {
    const categoryCfg = categoryConfig();
    expect(() => categoryConfigSchema.parse(categoryCfg)).not.toThrow();
  });

  it('should throw if duplicate refs to audits or groups in references are given', () => {
    const categoryCfg = categoryConfig();
    const refs = categoryCfg.refs;
    categoryCfg.refs = [...refs, refs[0]];
    expect(() => categoryConfigSchema.parse(categoryCfg)).toThrow(
      'the following audit or group refs are duplicates',
    );
  });

  it('should throw if only refs with weight 0 are included', () => {
    const categoryCfg = categoryConfig();
    const ref = { ...categoryCfg.refs[0], weight: 0 };
    categoryCfg.refs = [ref];

    expect(() => categoryConfigSchema.parse(categoryCfg)).toThrow(
      `In a category there has to be at lease one ref with weight > 0`,
    );
  });
});
