export interface Encoder<I, O> {
  encode(input: I): O;
}

export interface Decoder<O, I> {
  decode(output: O): I;
}

export interface Sink<I, O> extends Encoder<I, O> {
  open(): void;
  write(input: I): void;
  close(): void;
}

export interface Buffered {
  flush(): void;
}
export interface BufferedSink<I, O> extends Sink<I, O>, Buffered {}

export interface Source<I, O = any> {
  read?(): O;
  decode?(input: I): O;
}

export interface Recoverable {
  recover(): RecoverResult;
  finalize(): void;
}

export interface RecoverResult<T = any> {
  records: T[];
  errors: Array<{ lineNo: number; line: string; error: Error }>;
  partialTail: string | null;
}

export interface RecoverOptions<T = any> {
  keepInvalid?: boolean;
}

export interface Output<I, O> extends BufferedSink<I, O> {}
