import {beforeEach, vi} from "vitest";
import {ui} from "../../src/lib/logging";

vi.mock('../../src/lib/logging', async () => {
  const module = await vi.importActual('../../src/lib/logging');

  module.ui().switchMode('raw')
  return module;
});

beforeEach(() => {
   ui().logger.flushLogs();
})
