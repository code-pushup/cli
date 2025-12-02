import ansis from 'ansis';
import { logger } from '@code-pushup/utils';
import { log } from './log.js';

describe('log', () => {
  it('should add logo prefix and ending line-break to message', () => {
    log('info', 'Running Code PushUp in standalone mode');
    expect(logger.info).toHaveBeenCalledWith(
      `${ansis.bold.blue('<✓>')} Running Code PushUp in standalone mode\n`,
    );
  });

  it('should add logo prefix to each line', () => {
    log('debug', 'Found 3 Nx projects:\n- api\n- backoffice\n- frontoffice');
    expect(logger.debug).toHaveBeenCalledWith(
      `
${ansis.bold.blue('<✓>')} Found 3 Nx projects:
${ansis.bold.blue('<✓>')} - api
${ansis.bold.blue('<✓>')} - backoffice
${ansis.bold.blue('<✓>')} - frontoffice
`.trimStart(),
    );
  });

  it('should not add final line-break if already present', () => {
    log('warn', 'Comment body is too long, truncating to 1000 characters\n');
    expect(logger.warn).toHaveBeenCalledWith(
      `${ansis.bold.blue('<✓>')} Comment body is too long, truncating to 1000 characters\n`,
    );
  });
});
