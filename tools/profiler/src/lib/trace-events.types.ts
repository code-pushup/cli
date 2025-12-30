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
  id?: string;
  id2?: { local: string };
  args?: Record<string, unknown>;
};

// Specific event types for better type safety
export interface InstantEvent extends TraceEvent {
  ph: 'I' | 'i'; // Instant events
  s: 't'; // Timeline scope
  dur?: never; // No duration for instant events
  args?: {
    data?: {
      detail?: string; // JSON stringified detail object
      [key: string]: unknown;
    };
  };
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

// Flow events for causality tracking
export interface FlowStartEvent extends TraceEvent {
  ph: 's'; // flow start
  id: string; // Required for flow events
  cat: string;
  name: string;
  pid: number;
  tid: number;
  ts: number;
  bp?: 'e' | 's'; // binding point for attaching to other events
  args?: Record<string, unknown>;
}

export interface FlowStepEvent extends TraceEvent {
  ph: 't'; // flow step
  id: string; // Required for flow events
  cat: string;
  name: string;
  pid: number;
  tid: number;
  ts: number;
  args?: Record<string, unknown>;
}

export interface FlowEndEvent extends TraceEvent {
  ph: 'f'; // flow end
  id: string; // Required for flow events
  cat: string;
  name: string;
  pid: number;
  tid: number;
  ts: number;
  bp?: 'e' | 's'; // binding point for attaching to other events
  args?: Record<string, unknown>;
}

// Union type for flow events
export type FlowEvent = FlowStartEvent | FlowStepEvent | FlowEndEvent;

// Union type for all specific event types
export type TypedTraceEvent =
  | InstantEvent
  | CompleteEvent
  | SpanEvent
  | FlowEvent;
