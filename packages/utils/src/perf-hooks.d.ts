import type {
  EventLoopUtilityFunction,
  MeasureOptions as OriginalMeasureOptions,
  Performance as OriginalPerformance,
  PerformanceEntry as OriginalPerformanceEntry,
  PerformanceMark as OriginalPerformanceMark,
  PerformanceMeasure as OriginalPerformanceMeasure,
  PerformanceObserverEntryList as OriginalPerformanceObserverEntryList,
  PerformanceNodeTiming,
  PerformanceResourceTiming,
  TimerifyOptions,
  performance,
} from 'perf_hooks';
import type { DetailPayloadWithDevtools } from './lib/user-timing-extensibility-api.type';

export type EntryType = 'mark' | 'measure';

export type DOMHighResTimeStamp = number;

/* == Internal Overrides Start == */
// This is needed to get pickedup by the IDE. We cand directly do this in the exported definitions
interface PerformanceEntryExtended {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  readonly detail?: DetailPayloadWithDevtools;
  toJSON(): any;
}

interface MarkEntryExtended extends OriginalPerformanceMark {
  readonly entryType: 'mark';
}

interface MeasureEntryExtended extends OriginalPerformanceMeasure {
  readonly entryType: 'measure';
}

interface PerformanceMarkExtended extends PerformanceEntryExtended {
  readonly entryType: 'mark';
  readonly duration: 0;
}

interface PerformanceMeasureExtended extends PerformanceEntryExtended {
  readonly entryType: 'measure';
}

interface PerformanceObserverEntryListExtended
  extends OriginalPerformanceObserverEntryList {
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

declare class PerformanceExtended {
  clearMarks(name?: string): void;
  clearMeasures(name?: string): void;
  clearResourceTimings(name?: string): void;
  eventLoopUtilization: EventLoopUtilityFunction;

  mark(
    name: string,
    options?: PerformanceMarkOptionsExtended,
  ): PerformanceMarkExtended;

  markResourceTiming(
    timingInfo: object,
    requestedUrl: string,
    initiatorType: string,
    global: object,
    cacheMode: '' | 'local',
    bodyInfo: object,
    responseStatus: number,
    deliveryType?: string,
  ): PerformanceResourceTiming;

  measure(
    name: string,
    startMarkOrOptions?: string | PerformanceMeasureOptionsExtended,
    endMark?: string,
  ): PerformanceMeasureExtended;

  readonly nodeTiming: PerformanceNodeTiming;
  now(): number;
  setResourceTimingBufferSize(maxSize: number): void;
  readonly timeOrigin: number;
  timerify<T extends (...params: any[]) => any>(
    fn: T,
    options?: TimerifyOptions,
  ): T;
  toJSON(): any;

  getEntriesByType: (type: EntryType) => PerformanceEntryExtended[];
  getEntries(): PerformanceEntryExtended[];
  getEntriesByName(name: string, type?: EntryType): PerformanceEntryExtended[];
}
/* == Internal Overrides End == */

declare module 'perf_hooks' {
  export interface PerformanceEntry extends OriginalPerformanceEntry {
    readonly detail?: DetailPayloadWithDevtools;
  }

  export interface PerformanceEntryList extends PerformanceEntryListExtended {}

  export interface MarkEntry extends PerformanceMark, MarkEntryExtended {}

  export interface MeasureEntry
    extends PerformanceMeasure,
      MeasureEntryExtended {}

  export interface PerformanceMark extends PerformanceMarkExtended {}

  export interface PerformanceMeasure extends PerformanceMeasureExtended {}

  export interface MarkOptions extends PerformanceMarkOptionsExtended {}

  export interface MeasureOptions extends PerformanceMeasureOptionsExtended {}

  export type PerformanceMarkOptions = PerformanceMarkOptionsExtended;

  export type PerformanceMeasureOptions = PerformanceMeasureOptionsExtended;

  export interface PerformanceObserverEntryList
    extends PerformanceObserverEntryListExtended {}

  export const performance: PerformanceExtended;
}

declare module 'node:perf_hooks' {
  export interface PerformanceEntry extends OriginalPerformanceEntry {
    readonly detail?: DetailPayloadWithDevtools;
  }

  export interface PerformanceEntryList extends PerformanceEntryListExtended {}

  export interface MarkEntry extends PerformanceMark, MarkEntryExtended {}

  export interface MeasureEntry
    extends PerformanceMeasure,
      MeasureEntryExtended {}

  export interface PerformanceMark extends PerformanceMarkExtended {}

  export interface PerformanceMeasure extends PerformanceMeasureExtended {}

  export interface MarkOptions extends PerformanceMarkOptionsExtended {}

  export interface MeasureOptions extends PerformanceMeasureOptionsExtended {}

  export type PerformanceMarkOptions = PerformanceMarkOptionsExtended;

  export type PerformanceMeasureOptions = PerformanceMeasureOptionsExtended;

  export interface PerformanceObserverEntryList
    extends PerformanceObserverEntryListExtended {}

  export const performance: PerformanceExtended;
}
