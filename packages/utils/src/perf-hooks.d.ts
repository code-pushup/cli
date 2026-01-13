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
  interface PerformanceEntry {
    readonly detail?: DetailPayloadWithDevtools;
  }

  interface MarkEntry extends PerformanceMark {
    readonly entryType: 'mark';
    readonly detail?: DetailPayloadWithDevtools;
  }

  interface MeasureEntry extends PerformanceMeasure {
    readonly entryType: 'measure';
    readonly detail?: DetailPayloadWithDevtools;
  }

  interface PerformanceMark extends PerformanceEntry {}
  interface PerformanceMeasure extends PerformanceEntry {}

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

  export interface PerformanceObserverEntryList {
    getEntriesByType: (type: EntryType) => PerformanceEntry[];
  }

  const performance: {
    mark: (name: string, options?: PerformanceMarkOptions) => PerformanceMark;

    measure: (
      name: string,
      startOrOptions?: string | number | PerformanceMeasureOptions,
      end?: string | number,
    ) => PerformanceMeasure;

    getEntriesByType: (type: EntryType) => PerformanceEntry[];
  };
}
