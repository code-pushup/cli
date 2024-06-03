import chalk from 'chalk';
import { Result } from 'lighthouse/types/lhr/audit-result';
import { describe, expect, it } from 'vitest';
import { getLogMessages } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { logUnsupportedDetails, toAuditDetails } from './details';

describe('logUnsupportedDetails', () => {
  it('should log unsupported entries', () => {
    logUnsupportedDetails([
      { details: { type: 'screenshot' } },
    ] as unknown as Result[]);
    expect(getLogMessages(ui().logger)).toHaveLength(1);
    expect(getLogMessages(ui().logger).at(0)).toBe(
      `[ cyan(debug) ] ${chalk.yellow('⚠')} Plugin ${chalk.bold(
        'lighthouse',
      )} skipped parsing of unsupported audit details: ${chalk.bold(
        'screenshot',
      )}`,
    );
  });
  it('should log only 3 details of unsupported entries', () => {
    logUnsupportedDetails([
      { details: { type: 'table' } },
      { details: { type: 'filmstrip' } },
      { details: { type: 'screenshot' } },
      { details: { type: 'opportunity' } },
      { details: { type: 'debugdata' } },
      { details: { type: 'treemap-data' } },
      { details: { type: 'criticalrequestchain' } },
    ] as unknown as Result[]);
    expect(getLogMessages(ui().logger)).toHaveLength(1);
    expect(getLogMessages(ui().logger).at(0)).toBe(
      `[ cyan(debug) ] ${chalk.yellow('⚠')} Plugin ${chalk.bold(
        'lighthouse',
      )} skipped parsing of unsupported audit details: ${chalk.bold(
        'filmstrip, screenshot, opportunity',
      )} and 3 more.`,
    );
  });
});

describe('toAuditDetails', () => {
  it('should render audit details of type table', () => {
    const outputs = toAuditDetails({
      type: 'table',
      headings: [
        {
          key: 'name',
          valueType: 'text',
          label: 'Name',
        },
        {
          key: 'duration',
          valueType: 'ms',
          label: 'Duration',
        },
      ],
      items: [
        {
          name: 'Zone',
          duration: 0.634,
        },
        {
          name: 'Zone:ZoneAwarePromise',
          duration: 0.783,
        },
      ],
    });

    expect(outputs).toStrictEqual({
      table: {
        columns: [
          {
            key: 'name',
            label: 'Name',
            align: 'left',
          },
          {
            key: 'duration',
            label: 'Duration',
            align: 'left',
          },
        ],
        rows: [
          {
            name: 'Zone',
            duration: '0.634 ms',
          },
          {
            name: 'Zone:ZoneAwarePromise',
            duration: '0.783 ms',
          },
        ],
      },
    });
  });

  it('should render audit details of type debugdata', () => {
    const outputs = toAuditDetails({
      type: 'debugdata',
      items: [
        {
          cumulativeLayoutShiftMainFrame: 0.000_350_978_852_728_593_95,
        },
      ],
    });

    // @TODO add check that cliui.logger is called. Resolve TODO after PR #487 is merged.

    expect(outputs).toStrictEqual({});
  });

  it('should inform that filmstrip detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'filmstrip',
      scale: 3000,
      items: [
        {
          timing: 375,
          timestamp: 106_245_424_545,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwY...',
        },
      ],
    });

    expect(outputs).toStrictEqual({});
  });

  it('should inform that screenshot detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'screenshot',
      timing: 541,
      timestamp: 106_245_590_644,
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==',
    });

    expect(outputs).toStrictEqual({});
  });

  it('should inform that treemap-data detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'treemap-data',
      nodes: [],
    });

    expect(outputs).toStrictEqual({});
  });

  it('should inform that criticalrequestchain detail type is not supported yet', () => {
    const outputs = toAuditDetails({
      type: 'criticalrequestchain',
      chains: {
        EED301D300C9A7B634A444E0C6019FC1: {
          request: {
            url: 'https://example.com/',
            startTime: 106_245.050_727,
            endTime: 106_245.559_225,
            responseReceivedTime: 106_245.559_001,
            transferSize: 849,
          },
        },
      },
      longestChain: {
        duration: 508.498_000_010_848_05,
        length: 1,
        transferSize: 849,
      },
    });

    expect(outputs).toStrictEqual({});
  });
});
