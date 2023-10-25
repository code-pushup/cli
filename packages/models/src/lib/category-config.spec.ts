import { describe, expect, it } from 'vitest';
import { categoryConfigs } from '../../test/fixtures/categories.mock';
import { categoryConfigSchema } from './category-config';

describe('categoryConfigSchema', () => {
  it('should parse if configuration with valid audit and refs', () => {
    const categoryConfig = categoryConfigs()[0];
    expect(() => categoryConfigSchema.parse(categoryConfig)).not.toThrow();
  });

  it('should throw if duplicate refs to audits or groups in references are given', () => {
    const categoryConfig = categoryConfigs()[0];
    const refs = categoryConfig.refs;
    categoryConfig.refs = [...refs, refs[0]];
    expect(() => categoryConfigSchema.parse(categoryConfig)).toThrow(
      'the following audit or group refs are duplicates',
    );
  });
});
