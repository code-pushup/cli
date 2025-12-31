import type { MarkOptions } from 'node:perf_hooks';

export type MarkOpts = MarkOptions & { detail?: unknown };

export type SpanCallbackOptions<T, K extends string = never> = {
  onStart?: () => MarkOpts;
  onSuccess?: (result: T) => MarkOpts;
  onError?: (error: unknown) => MarkOpts;
  helpers?: {
    createSuccessDetail: (
      result: T,
      options?: {
        properties?: Array<[string, string]>;
        tooltipText?: string;
        color?: import('./user-timing-details.type').DevToolsColorToken;
      },
    ) => MarkOpts;
    createErrorDetail: (
      error: unknown,
      options?: { properties?: Array<[string, string]>; tooltipText?: string },
    ) => MarkOpts;
    createStartDetail: (options?: {
      properties?: Array<[string, string]>;
      tooltipText?: string;
      color?: import('./user-timing-details.type').DevToolsColorToken;
    }) => MarkOpts;
  };
};

export type SpanOptions<T, K extends string = never> =
  | MarkOpts
  | SpanCallbackOptions<T, K>;

export function isCallbackOptions<T>(
  options: SpanOptions<T> | undefined,
): options is SpanCallbackOptions<T> {
  return (
    options != null &&
    typeof options === 'object' &&
    ('onSuccess' in options || 'onError' in options)
  );
}
