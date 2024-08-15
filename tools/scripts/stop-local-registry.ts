/**
 * This script stops the local registry for e2e testing purposes.
 * It is meant to be called in jest's globalTeardown.
 */

export default (stopLocalRegistry?: () => void) => {
  if (typeof stopLocalRegistry === 'function') {
    stopLocalRegistry();
  } else {
    console.log('stopLocalRegistry: ', stopLocalRegistry);
  }
};
