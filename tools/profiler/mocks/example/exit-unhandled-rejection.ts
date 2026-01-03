// 1. Generate output:
// npx tsx ./example/exit-unhandled-rejection.ts
// 2. Evaluate output:

/*
node -e "
const out = require(\"./tmp/profiles/exit-fatal-unhandled-rejection.json\");
const contentCheck = [
  {\"cat\":\"devtools.timeline\", \"name\":\"TracingStartedInBrowser\"},
  {\"cat\":\"devtools.timeline\", \"name\":\"RunTask\"},
  {\"cat\":\"blink.user_timing\",\"s\":\"t\",\"ph\":\"I\",\"name\":\"PROCESS:FATAL-ERROR: Error\"},
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

getProfiler({
  enabled: true,
  fileBaseName: 'exit-fatal-unhandled-rejection',
});
Promise.reject(new Error('Unhandled promise rejection'));
