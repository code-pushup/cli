import { describe, expect, it } from 'vitest';
import { AXE_PLUGIN_SLUG } from './constants.js';
import { axeAuditRef, axeGroupRef } from './utils.js';

describe('axeGroupRef', () => {
  it('should create a group reference with default weight', () => {
    expect(axeGroupRef('aria')).toEqual({
      plugin: AXE_PLUGIN_SLUG,
      slug: 'aria',
      type: 'group',
      weight: 1,
    });
  });

  it('should create a group reference with custom weight', () => {
    expect(axeGroupRef('forms', 3)).toEqual({
      plugin: AXE_PLUGIN_SLUG,
      slug: 'forms',
      type: 'group',
      weight: 3,
    });
  });
});

describe('axeAuditRef', () => {
  it('should create an audit reference with default weight', () => {
    expect(axeAuditRef('color-contrast')).toEqual({
      plugin: AXE_PLUGIN_SLUG,
      slug: 'color-contrast',
      type: 'audit',
      weight: 1,
    });
  });

  it('should create an audit reference with custom weight', () => {
    expect(axeAuditRef('button-name', 2)).toEqual({
      plugin: AXE_PLUGIN_SLUG,
      slug: 'button-name',
      type: 'audit',
      weight: 2,
    });
  });
});
