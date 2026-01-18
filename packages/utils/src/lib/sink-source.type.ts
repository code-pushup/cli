export type Encoder<I, O> = {
  encode: (input: I) => O;
};

export type Decoder<O, I> = {
  decode: (output: O) => I;
};

export type Sink<I, O> = {
  open: () => void;
  write: (input: I) => void;
  close: () => void;
  isClosed: () => boolean;
} & Encoder<I, O>;

export type Buffered = {
  flush: () => void;
};
export type BufferedSink<I, O> = Sink<I, O> & Buffered;

export type Source<I, O = unknown> = {
  read?: () => O;
  decode?: (input: I) => O;
};

export type Observer = {
  subscribe: () => void;
  unsubscribe: () => void;
  isSubscribed: () => boolean;
};

export type Recoverable<T = unknown> = {
  recover: () => RecoverResult<T>;
  repack: () => void;
  finalize: () => void;
};

export type RecoverResult<T = unknown> = {
  records: T[];
  errors: { lineNo: number; line: string; error: Error }[];
  partialTail: string | null;
};

export type RecoverOptions = {
  keepInvalid?: boolean;
};

export type Output<I, O> = {} & BufferedSink<I, O>;
