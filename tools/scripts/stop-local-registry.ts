/**
 * This script stops the local registry for e2e testing purposes.
 * It is meant to be called in jest's globalTeardown.
 */

export default (stopLocalRegistry?: () => void, registry?: string) => {
  if (stopLocalRegistry == null) {
    throw new Error(
      'global e2e teardown script was not able to derive the stop script for the active registry from "activeRegistry"',
    );
  }
  console.info(`Stop local registry: ${registry}`);
  if (typeof stopLocalRegistry === 'function') {
    stopLocalRegistry();
  } else {
    console.log('WRONG stopLocalRegistry: ', stopLocalRegistry);
  }
};
