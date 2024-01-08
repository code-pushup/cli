import { describe, expect, it } from 'vitest';
import { config } from '../../test';
import { groupSchema } from './group';

describe('groupSchema', () => {
  it('should throw if a group has duplicate audit refs', () => {
    const group = config().plugins[1].groups[0];
    group.refs = [...group.refs, group.refs[0]];

    expect(() => groupSchema.parse(group)).toThrow(
      'In plugin groups the following references are not unique',
    );
  });
});
