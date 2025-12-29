export type TraceEvent = {
  cat: string;
  name: string;
  s?: string;
  ph: string;
  pid: number;
  tid: number;
  ts: number;
  tts?: number;
  dur?: number;
  id2?: { local: string };
  args?: Record<string, unknown>;
  stack?: string;
};

// Specific event types for better type safety
export interface InstantEvent extends TraceEvent {
  ph: 'I' | 'i'; // Instant events
  s: 't'; // Timeline scope
  tts: number; // Thread timestamp required for instant events
  dur?: never; // No duration for instant events
}

export interface CompleteEvent extends TraceEvent {
  ph: 'X'; // Complete event
  dur: number; // Duration required for complete events
  tts?: never; // No thread timestamp for complete events
}

export interface BeginEvent extends TraceEvent {
  ph: 'b'; // Begin event
  id2: { local: string }; // Required for span events
  tts?: never; // No thread timestamp for begin events
  dur?: never; // No duration for begin events
}

export interface EndEvent extends TraceEvent {
  ph: 'e'; // End event
  id2: { local: string }; // Required for span events
  tts?: never; // No thread timestamp for end events
  dur?: never; // No duration for end events
}

// Union type for span events (begin/end pairs)
export type SpanEvent = BeginEvent | EndEvent;

// Union type for all specific event types
export type TypedTraceEvent = InstantEvent | CompleteEvent | SpanEvent;
