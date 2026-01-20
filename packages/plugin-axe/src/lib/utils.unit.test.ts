import { AXE_PLUGIN_SLUG } from './constants.js';
import {
  axeAuditRef,
  axeAuditRefs,
  axeGroupRef,
  axeGroupRefs,
} from './utils.js';

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

describe('axeGroupRefs', () => {
  it('should return refs for all groups when no slug provided', () => {
    expect(
      axeGroupRefs({
        groups: [
          { slug: 'aria-1', title: 'ARIA (url1)', refs: [] },
          { slug: 'aria-2', title: 'ARIA (url2)', refs: [] },
        ],
        context: { urlCount: 2, weights: { 1: 2, 2: 3 } },
      }),
    ).toStrictEqual([
      { plugin: AXE_PLUGIN_SLUG, slug: 'aria-1', type: 'group', weight: 2 },
      { plugin: AXE_PLUGIN_SLUG, slug: 'aria-2', type: 'group', weight: 3 },
    ]);
  });

  it('should return refs for specific group when slug provided', () => {
    expect(
      axeGroupRefs(
        {
          groups: [
            { slug: 'aria-1', title: 'ARIA (url1)', refs: [] },
            { slug: 'aria-2', title: 'ARIA (url2)', refs: [] },
          ],
          context: { urlCount: 2, weights: { 1: 1, 2: 1 } },
        },
        'aria',
        3,
      ),
    ).toStrictEqual([
      { plugin: AXE_PLUGIN_SLUG, slug: 'aria-1', type: 'group', weight: 2 },
      { plugin: AXE_PLUGIN_SLUG, slug: 'aria-2', type: 'group', weight: 2 },
    ]);
  });

  it('should return empty array when plugin has no groups', () => {
    expect(
      axeGroupRefs({
        groups: undefined,
        context: { urlCount: 1, weights: { 1: 1 } },
      }),
    ).toBeEmpty();
  });
});

describe('axeAuditRefs', () => {
  it('should return refs for specific audit with multi-URL expansion', () => {
    expect(
      axeAuditRefs(
        {
          audits: [
            { slug: 'label-1', title: 'Form elements must have labels (url1)' },
            { slug: 'label-2', title: 'Form elements must have labels (url2)' },
            { slug: 'aria-roles-1', title: '`[role]` values are valid (url1)' },
            { slug: 'aria-roles-2', title: '`[role]` values are valid (url2)' },
          ],
          context: { urlCount: 2, weights: { 1: 1, 2: 2 } },
        },
        'aria-roles',
        3,
      ),
    ).toStrictEqual([
      {
        plugin: AXE_PLUGIN_SLUG,
        slug: 'aria-roles-1',
        type: 'audit',
        weight: 2,
      },
      {
        plugin: AXE_PLUGIN_SLUG,
        slug: 'aria-roles-2',
        type: 'audit',
        weight: 2.5,
      },
    ]);
  });

  it('should return refs for all audits when no slug provided', () => {
    expect(
      axeAuditRefs({
        audits: [{ slug: 'duplicate-id-aria', title: 'ARIA IDs are unique' }],
        context: { urlCount: 1, weights: { 1: 1 } },
      }),
    ).toStrictEqual([
      {
        plugin: AXE_PLUGIN_SLUG,
        slug: 'duplicate-id-aria',
        type: 'audit',
        weight: 1,
      },
    ]);
  });
});
