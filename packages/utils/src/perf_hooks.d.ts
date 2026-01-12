import type {
  MarkerPayload,
  TrackEntryPayload,
  WithDevToolsPayload,
} from './lib/user-timing-extensibility-api.type';

export {};

type DetailPayloadWithDevtools = WithDevToolsPayload<
  TrackEntryPayload | MarkerPayload
>;

declare module 'node:perf_hooks' {
  export interface PerformanceMarkOptions {
    detail?: DetailPayloadWithDevtools;
    startTime?: DOMHighResTimeStamp;
  }

  export interface PerformanceMeasureOptions {
    detail?: DetailPayloadWithDevtools;
    start?: string | number;
    end?: string | number;
    duration?: number;
  }

  const performance: {
    mark(
      name: string,
      options?: {
        detail?: DetailPayloadWithDevtools;
      },
    ): PerformanceMark;

    measure(
      name: string,
      startOrOptions?:
        | string
        | number
        | {
            detail?: DetailPayloadWithDevtools;
            start?: string | number;
            end?: string | number;
            duration?: number;
          },
      end?: string | number,
    ): PerformanceMeasure;
  };
}
