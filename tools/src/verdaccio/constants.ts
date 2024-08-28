import { join } from 'node:path';

export const START_VERDACCIO_SERVER_TARGET_NAME = 'start-verdaccio-server';
export const START_VERDACCIO_ENV_TARGET_NAME = 'start-verdaccio-env';
export const STOP_VERDACCIO_TARGET_NAME = 'stop-verdaccio';
export const DEFAULT_VERDACCIO_STORAGE = join('tmp', 'verdaccio', 'storage');
export const DEFAULT_VERDACCIO_CONFIG = join('.verdaccio', 'config.yml');
