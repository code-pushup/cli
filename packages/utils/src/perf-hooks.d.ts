import type {
  Performance,
  PerformanceEntry,
  PerformanceMark,
  PerformanceMeasure,
  PerformanceObserverEntryList,
} from 'node:perf_hooks';
import type { DetailPayloadWithDevtools } from './lib/user-timing-extensibility-api.type';

export type EntryType = 'mark' | 'measure';

export type DOMHighResTimeStamp = number;

/* == Internal Overrides Start == */
interface PerformanceEntryExtended extends PerformanceEntry {
  readonly detail?: DetailPayloadWithDevtools;
}

interface MarkEntryExtended extends PerformanceMark {
  readonly entryType: 'mark';
}

interface MeasureEntryExtended extends PerformanceMeasure {
  readonly entryType: 'measure';
}

interface PerformanceMarkExtended extends PerformanceMark {
  readonly detail?: DetailPayloadWithDevtools;
}

interface PerformanceMeasureExtended extends PerformanceMeasure {
  readonly detail?: DetailPayloadWithDevtools;
}

interface PerformanceObserverEntryListExtended
  extends PerformanceObserverEntryList {
  getEntries(): PerformanceEntryExtended[];
  getEntriesByName(name: string, type?: EntryType): PerformanceEntryExtended[];
  getEntriesByType(type: EntryType): PerformanceEntryExtended[];
}

interface PerformanceMarkOptionsExtended {
  detail?: DetailPayloadWithDevtools;
  startTime?: DOMHighResTimeStamp;
}

interface PerformanceMeasureOptionsExtended {
  detail?: DetailPayloadWithDevtools;
  start?: string | number;
  end?: string | number;
  duration?: number;
}

interface PerformanceEntryListExtended {
  getEntries(): PerformanceEntryExtended[];
  getEntriesByName(name: string, type?: EntryType): PerformanceEntryExtended[];
  getEntriesByType(type: EntryType): PerformanceEntryExtended[];
}

interface PerformanceExtended extends Performance {
  mark: (
    name: string,
    options?: PerformanceMarkOptionsExtended,
  ) => PerformanceMarkExtended;
  measure: (
    name: string,
    startOrOptions?: string | number | PerformanceMeasureOptionsExtended,
    end?: string | number,
  ) => PerformanceMeasureExtended;
  getEntriesByType: (type: EntryType) => PerformanceEntryExtended[];
  getEntries(): PerformanceEntryExtended[];
  getEntriesByName(name: string, type?: EntryType): PerformanceEntryExtended[];
  takeRecords(): PerformanceEntryExtended[];
}
/* == Internal Overrides End == */

declare module 'node:perf_hooks' {
  export interface PerformanceEntry extends PerformanceEntryExtended {}

  export interface PerformanceEntryList extends PerformanceEntryListExtended {}

  export interface MarkEntry extends PerformanceMark, MarkEntryExtended {}

  export interface MeasureEntry
    extends PerformanceMeasure,
      MeasureEntryExtended {}

  export interface PerformanceMark extends PerformanceMarkExtended {}

  export interface PerformanceMeasure extends PerformanceMeasureExtended {}

  export interface PerformanceMarkOptions
    extends PerformanceMarkOptionsExtended {}

  export interface PerformanceMeasureOptions
    extends PerformanceMeasureOptionsExtended {}

  export interface PerformanceObserverEntryList
    extends PerformanceObserverEntryListExtended {}

  const performance: PerformanceExtended;
}
