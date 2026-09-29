import {
  parseLoosePort,
  parsePortFromConfigFile,
  parsePortFromSection,
} from './parse-config-port.js';

describe('parsePortFromSection', () => {
  it('should parse port from a named config section', () => {
    expect(
      parsePortFromSection(
        'export default { server: { port: 3001 } }',
        'server',
      ),
    ).toBe(3001);
  });

  it('should return null when section is missing', () => {
    expect(parsePortFromSection('export default {}', 'server')).toBeNull();
  });
});

describe('parseLoosePort', () => {
  it('should parse the first loose port assignment', () => {
    expect(
      parseLoosePort('const port = 1; export default { port: 4321 }'),
    ).toBe(4321);
  });

  it('should return first port when multiple appear', () => {
    expect(
      parseLoosePort('const x = { port: 1234 }; const y = { port: 5678 }'),
    ).toBe(1234);
  });

  it('should return null when no port is present', () => {
    expect(parseLoosePort('export default {}')).toBeNull();
  });
});

describe('parsePortFromConfigFile', () => {
  it('should return null when file does not exist', async () => {
    await expect(
      parsePortFromConfigFile('/nonexistent/vite.config.ts'),
    ).resolves.toBeNull();
  });

  it('should return null when file has no port', async () => {
    await expect(
      parsePortFromConfigFile(
        new URL('./parse-config-port.unit.test.ts', import.meta.url).pathname,
        { sections: ['server'] },
      ),
    ).resolves.toBeNull();
  });
});
