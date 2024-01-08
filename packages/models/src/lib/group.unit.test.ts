import { describe, expect, it } from 'vitest';
import { config } from '../../test';
import { auditGroupSchema } from './group';

describe('auditGroupSchema', () => {
  it('should throw if a group has duplicate audit refs', () => {
    const group = config().plugins[1].groups[0];
    group.refs = [...group.refs, group.refs[0]];

    expect(() => auditGroupSchema.parse(group)).toThrow(
      'In plugin groups the audit refs are not unique',
    );
  });
});
