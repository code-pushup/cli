import { pluginMetaLogFormatter } from '@code-pushup/utils';
import { AXE_PLUGIN_TITLE } from '../constants.js';

/** Formats log messages with the Axe plugin prefix. */
export const formatMetaLog = pluginMetaLogFormatter(AXE_PLUGIN_TITLE);
