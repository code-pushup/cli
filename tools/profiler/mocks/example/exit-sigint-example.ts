// 1. Generate output:
// npx tsx ./example/exit-sigint-example.ts
// 2. Evaluate output:

/*
node -e "
const out = require(\"./tmp/profiles/exit-sigint.json\");
const contentCheck = [
  {\"cat\":\"devtools.timeline\", \"name\":\"TracingStartedInBrowser\"},
  {\"cat\":\"devtools.timeline\", \"name\":\"RunTask\"},
  {\"cat\":\"blink.user_timing\", \"ph\":\"I\",\"name\":\"sigint-example-start\"},
  {\"cat\":\"devtools.timeline\",\"ph\":\"X\",\"name\":\"RunTask\"}
];
contentCheck.map(expected => {
  const found = out.traceEvents?.find(event =>
    Object.keys(expected).every(key => event[key] === expected[key])
  );
  return found ? \"✓\" : \"✗\";
});
"
*/
import { getProfiler } from '../../src/index.js';

const profiler = getProfiler({
  enabled: true,
  fileBaseName: 'exit-sigint',
});

profiler.mark('sigint-example-start');

setTimeout(() => {
  process.kill(process.pid, 'SIGINT');
}, 200);
