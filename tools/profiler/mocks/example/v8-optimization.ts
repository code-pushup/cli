import { sequentialWork, work } from '../test-utils';

// V8 optimized if called 1 time
// Comment in to see the first measure shrink to the same sizes as the other calls
// work();

performance.mark('1:1');
sequentialWork([work, work]);
performance.measure('1', '1:1');
performance.mark('2:1');
sequentialWork([work, work]);
performance.measure('2', '2:1');
performance.mark('3:1');
sequentialWork([work, work]);
performance.measure('3', '3:1');
