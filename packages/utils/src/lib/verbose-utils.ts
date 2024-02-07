import { ui } from './logging';

function getLogVerbose(verbose = false) {
  return (msg: string) => {
    if (verbose) {
      ui().logger.info(msg);
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
