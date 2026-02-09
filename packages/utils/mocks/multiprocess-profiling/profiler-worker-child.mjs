import { NodejsProfiler } from '../../src/lib/profiler/profiler-node.js';
import {
  createBufferedEvents,
  getProfilerConfig,
  performDummyWork,
} from './utils.js';

await createBufferedEvents();

const profiler = new NodejsProfiler(getProfilerConfig());

await performDummyWork(profiler);

profiler.close();
