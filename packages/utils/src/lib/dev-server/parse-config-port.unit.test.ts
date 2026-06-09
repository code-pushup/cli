import { parseLoosePort, parsePortFromSection } from './parse-config-port.js';

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
});
