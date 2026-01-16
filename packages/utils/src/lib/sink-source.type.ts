export type Encoder<T> = (value: T) => string;
export type Decoder<T> = (line: string) => T;

export type EncoderInterface<I, O> = {
  encode: (input: I) => O;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Sink<I = string | Buffer, O = unknown> = {
  setPath: (filePath: string) => void;
  getPath: () => string;
  open: () => void;
  write: (input: I) => void;
  close: () => void;
  isClosed: () => boolean;
};

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

export type Recoverable<T> = {
  recover: () => RecoverResult<T>;
  repack: (outputPath?: string) => void;
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
