/**
 * Test utilities for simulating work operations that can optionally throw errors
 */

export interface ErrorOptions {
  wrapErrors?: boolean;
  wrapMessage?: string;
}

/**
 * Simulates synchronous work that can optionally throw an error
 * @param shouldThrow Whether to throw an error after doing work
 * @param workName Optional name for the work operation (used in error message)
 * @param options Error handling options
 */
export function work(
  shouldThrow = false,
  workName = 'work',
  options: ErrorOptions = {},
): void {
  // Simulate some CPU work
  for (let i = 0; i < 1e5; i++) {
    Math.sqrt(i);
  }

  if (shouldThrow) {
    const errorMessage = `${workName} operation failed`;
    if (options.wrapErrors) {
      const wrapMessage = options.wrapMessage || 'Wrapped error';
      throw new Error(`${wrapMessage}: ${errorMessage}`);
    } else {
      throw new Error(errorMessage);
    }
  }
}

/**
 * Simulates asynchronous work that can optionally throw an error
 * @param shouldThrow Whether to throw an error after doing work
 * @param workName Optional name for the work operation (used in error message)
 * @param options Error handling options
 */
export async function workAsync(
  shouldThrow = false,
  workName = 'async work',
  options: ErrorOptions = {},
): Promise<void> {
  // Simulate some async work
  await new Promise(resolve => setTimeout(resolve, 10));

  // Simulate some CPU work
  for (let i = 0; i < 1e5; i++) {
    Math.sqrt(i);
  }

  if (shouldThrow) {
    const errorMessage = `${workName} operation failed`;
    if (options.wrapErrors) {
      const wrapMessage = options.wrapMessage || 'Wrapped async error';
      throw new Error(`${wrapMessage}: ${errorMessage}`);
    } else {
      throw new Error(errorMessage);
    }
  }
}

/**
 * Simulates nested work with multiple levels that can throw at different levels
 * @param throwLevel Which level should throw (0 = no throw, 1 = level 1, 2 = level 2, 3 = level 3)
 * @param options Error handling options
 */
export async function nestedWork(
  throwLevel = 0,
  options: ErrorOptions = {},
): Promise<void> {
  // Level 3 (innermost)
  if (throwLevel === 3) {
    work(true, 'Level 3 nested work', options);
    return;
  }

  // Level 2
  work(false, 'Level 2 setup', options);
  if (throwLevel === 2) {
    work(true, 'Level 2 nested work', options);
    return;
  }

  // Level 1 (outermost)
  await workAsync(false, 'Level 1 async setup', options);
  if (throwLevel === 1) {
    const errorMessage = 'Level 1 nested work operation failed';
    if (options.wrapErrors) {
      const wrapMessage = options.wrapMessage || 'Level 1 error';
      throw new Error(`${wrapMessage}: ${errorMessage}`);
    } else {
      throw new Error(errorMessage);
    }
  }

  // Success case
  work(false, 'Level 1 completion', options);
}

/**
 * Simulates database operation that can optionally fail
 * @param shouldThrow Whether to simulate a database error
 * @param options Error handling options
 */
export async function databaseOperation(
  shouldThrow = false,
  options: ErrorOptions = {},
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 5));

  if (shouldThrow) {
    const errorMessage = 'Database connection timeout';
    if (options.wrapErrors) {
      const wrapMessage = options.wrapMessage || 'Database error';
      throw new Error(`${wrapMessage}: ${errorMessage}`);
    } else {
      throw new Error(errorMessage);
    }
  }

  return { success: true, data: 'mock data' };
}

/**
 * Simulates network/API call that can optionally fail
 * @param shouldThrow Whether to simulate a network error
 * @param options Error handling options
 */
export async function networkCall(
  shouldThrow = false,
  options: ErrorOptions = {},
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 15));

  if (shouldThrow) {
    const errorMessage = 'Network timeout';
    if (options.wrapErrors) {
      const wrapMessage = options.wrapMessage || 'Network error';
      throw new Error(`${wrapMessage}: ${errorMessage}`);
    } else {
      throw new Error(errorMessage);
    }
  }

  return { success: true, response: 'mock response' };
}
