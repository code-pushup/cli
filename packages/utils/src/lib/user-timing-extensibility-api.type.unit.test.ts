import { describe, expectTypeOf, it } from 'vitest';
import type {
  DevToolsColor,
  MarkerPayload,
  TrackEntryPayload,
  WithDevToolsPayload,
  WithErrorColor,
} from './user-timing-extensibility-api.type.js';

describe('TrackEntryPayload', () => {
  it('TrackEntryPayload extends ExtensionTrackBase and TrackMeta', () => {
    expectTypeOf<{
      dataType?: 'track-entry';
      track: string;
    }>().toMatchTypeOf<TrackEntryPayload>();
  });
});

describe('MarkerPayload', () => {
  it('MarkerPayload extends ExtensionTrackBase with required dataType', () => {
    expectTypeOf<{
      dataType: 'marker';
    }>().toMatchTypeOf<MarkerPayload>();
  });
});

describe('WithErrorColor', () => {
  it('WithErrorColor removes optional color and adds required error color', () => {
    expectTypeOf<{
      color: 'error';
      otherProp: string;
    }>().toMatchTypeOf<
      WithErrorColor<{ color?: DevToolsColor; otherProp: string }>
    >();
  });
});

describe('WithDevToolsPayload', () => {
  it('WithDevToolsPayload makes devtools optional', () => {
    expectTypeOf<{
      devtools?: TrackEntryPayload;
    }>().toMatchTypeOf<WithDevToolsPayload<TrackEntryPayload>>();
  });
});
