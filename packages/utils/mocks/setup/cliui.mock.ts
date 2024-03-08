import {beforeEach, vi} from "vitest";
import { type CliUi } from "../../src/lib/logging";

vi.mock('../../src/lib/logging', async () => {
  const module = await vi.importActual<{ui: () => CliUi}>('../../src/lib/logging');
  module.ui().switchMode('raw');
  return module;
});

beforeEach(async () => {
  const module = await vi.importActual<{ui: () => CliUi}>('../../src/lib/logging');
  module.ui().logger.flushLogs();
});
