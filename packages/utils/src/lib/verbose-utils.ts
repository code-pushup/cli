function getLogVerbose(verbose: boolean) {
  return (...args: unknown[]) => {
    if (verbose) {
      console.log(...args);
    }
  };
}

function getExecVerbose(verbose: boolean) {
  return (fn: () => unknown) => {
    if (verbose) {
      fn();
    }
  };
}

export const verboseUtils = (verbose: boolean) => ({
  log: getLogVerbose(verbose),
  exec: getExecVerbose(verbose),
});
