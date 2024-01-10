function getLogVerbose(verbose = false) {
  return (...args: unknown[]) => {
    if (verbose) {
      console.info(...args);
    }
  };
}

function getExecVerbose(verbose = false) {
  return (fn: () => unknown) => {
    if (verbose) {
      fn();
    }
  };
}

export const verboseUtils = (verbose = false) => ({
  log: getLogVerbose(verbose),
  exec: getExecVerbose(verbose),
});
