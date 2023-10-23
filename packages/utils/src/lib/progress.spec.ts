import { describe, expect } from 'vitest';
import {
  ProcessObserver,
  executeProcess,
  getProgress,
} from '@code-pushup/utils';

describe('progress', () => {
  it('should ', async () => {
    const process = () => executeProcess();
    observe();
  });
});

function observe(
  subscriberFn: (observer: ProcessObserver) => () => void,
): ProcessObserver {
  subscriberFn;
}
