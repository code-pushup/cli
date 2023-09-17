import { vi } from 'vitest';

const _log = console.log;
let mocked = false;
export function mockConsole(
  log: (...args: string[]) => void = (..._: string[]) => {
    void 0;
  },
) {
  console.log = vi.fn(log);
  mocked = true;
}

export function unmockConsole() {
  console.log = _log;
  mocked = false;
}
