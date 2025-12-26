import { describe, expect, it } from 'vitest';
import {
  type DevtoolsSpanConfig,
  type DevtoolsSpanHelpers,
  type DevtoolsSpansRegistry,
  type DevtoolsTrackEntryDetail,
  createDevtoolsSpans,
  createPluginDetailsSpan,
  createPluginSpan,
} from './span-helpers.js';

describe('createPluginSpan', () => {
  it('should create plugin span helper with correct defaults', () => {
    const spanHelper = createPluginSpan('eslint');

    const result = spanHelper({
      group: 'Plugins',
      properties: [['key', 'value']],
      tooltipText: 'Test tooltip',
    });

    expect(result).toEqual({
      devtools: {
        dataType: 'track-entry',
        track: 'Plugin:eslint',
        trackGroup: 'Plugins',
        color: 'secondary-dark',
        properties: [['key', 'value']],
        tooltipText: 'Test tooltip',
      },
    });
  });

  it('should allow custom color override', () => {
    const spanHelper = createPluginSpan('webpack');

    const result = spanHelper({
      group: 'Plugins',
      color: 'primary',
    });

    expect(result.devtools.color).toBe('primary');
  });
});

describe('createPluginDetailsSpan', () => {
  it('should create plugin details span helper with correct defaults', () => {
    const spanHelper = createPluginDetailsSpan('eslint');

    const result = spanHelper({
      group: 'Plugins',
      properties: [['key', 'value']],
      tooltipText: 'Test tooltip',
    });

    expect(result).toEqual({
      devtools: {
        dataType: 'track-entry',
        track: 'Plugin:eslint:details',
        trackGroup: 'Plugins',
        color: 'secondary-light',
        properties: [['key', 'value']],
        tooltipText: 'Test tooltip',
      },
    });
  });

  it('should allow custom color override', () => {
    const spanHelper = createPluginDetailsSpan('webpack');

    const result = spanHelper({
      group: 'Plugins',
      color: 'tertiary',
    });

    expect(result.devtools.color).toBe('tertiary');
  });
});

describe('createDevtoolsSpans', () => {
  it('should create span helpers from registry with static tracks', () => {
    const registry = {
      cli: { track: 'CLI', group: 'CodePushUp', color: 'primary' },
      plugin: { track: 'Plugin', group: 'Plugins', color: 'secondary' },
    } as const;

    const spans = createDevtoolsSpans(registry);

    const cliResult = spans.cli({
      properties: [['env', 'test']],
      tooltipText: 'CLI operation',
    });

    expect(cliResult).toEqual({
      devtools: {
        dataType: 'track-entry',
        track: 'CLI',
        trackGroup: 'CodePushUp',
        color: 'primary',
        properties: [['env', 'test']],
        tooltipText: 'CLI operation',
      },
    });
  });

  it('should create span helpers with dynamic tracks', () => {
    const registry = {
      dynamicPlugin: {
        track: (slug: string) => `Plugin:${slug}`,
        group: 'Plugins',
        color: 'secondary',
      },
    } as const;

    const spans = createDevtoolsSpans(registry);

    const pluginResult = spans.dynamicPlugin('eslint')({
      tooltipText: 'ESLint plugin operation',
    });

    expect(pluginResult).toEqual({
      devtools: {
        dataType: 'track-entry',
        track: 'Plugin:eslint',
        trackGroup: 'Plugins',
        color: 'secondary',
        properties: undefined,
        tooltipText: 'ESLint plugin operation',
      },
    });
  });

  it('should handle optional properties correctly', () => {
    const registry = {
      simple: { track: 'Simple', group: 'Test' },
    } as const;

    const spans = createDevtoolsSpans(registry);

    const result = spans.simple();

    expect(result).toEqual({
      devtools: {
        dataType: 'track-entry',
        track: 'Simple',
        trackGroup: 'Test',
        color: undefined,
        properties: undefined,
        tooltipText: undefined,
      },
    });
  });
});
