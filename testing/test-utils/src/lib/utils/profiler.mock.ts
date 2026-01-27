/**
 * Helper function to wait for PerformanceObserver callback and flush profiler.
 *
 * This is a common pattern in profiler integration tests where we need to:
 * 1. Wait for the PerformanceObserver callback to process entries (10ms delay)
 * 2. Flush the profiler to write queued entries to the sink
 *
 * @param profiler - The profiler instance to flush
 */
export async function awaitObserverCallbackAndFlush<
  T extends { flush(): void },
>(profiler: T): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10));
  profiler.flush();
}
