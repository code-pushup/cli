import type Details from 'lighthouse/types/lhr/audit-details.js';
import { parseCriticalRequestChainToAuditDetails } from './critical-request-chain.type.js';

describe('parseCriticalRequestChainToAuditDetails', () => {
  const details: Details.CriticalRequestChain = {
    type: 'criticalrequestchain',
    chains: {
      C49E1A2533B1ECBA8C5DB9292950C3C1: {
        request: {
          url: 'https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains',
          startTime: 28_303.087_316,
          endTime: 28_303.559_62,
          responseReceivedTime: 28_303.558_19,
          transferSize: 19_110,
        },
        children: {
          '52823.2': {
            request: {
              url: 'https://fonts.googleapis.com/css?family=Google+Sans:400,500|Roboto:400,400italic,500,500italic,700,700italic|Roboto+Mono:400,500,700&display=swap',
              startTime: 28_303.570_333,
              endTime: 28_303.620_989,
              responseReceivedTime: 28_303.608_522,
              transferSize: 3765,
            },
            children: {
              '52823.43': {
                request: {
                  url: 'https://fonts.gstatic.com/s/googlesans/v62/4UasrENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RPjIUvbQoi-E.woff2',
                  startTime: 28_303.757_482,
                  endTime: 28_303.805_565,
                  responseReceivedTime: 28_303.787_04,
                  transferSize: 36_754,
                },
              },
              '52823.128': {
                request: {
                  url: 'https://fonts.gstatic.com/s/robotomono/v23/L0xTDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vrtSM1J-gEPT5Ese6hmHSh0me8iUI0.woff2',
                  startTime: 28_303.757_727,
                  endTime: 28_303.821_67,
                  responseReceivedTime: 28_303.805_798,
                  transferSize: 22_850,
                },
              },
            },
          },
          '52823.3': {
            request: {
              url: 'https://fonts.googleapis.com/css2?family=Material+Icons&family=Material+Symbols+Outlined&display=block',
              startTime: 28_303.573_062,
              endTime: 28_303.628_164,
              responseReceivedTime: 28_303.626_091,
              transferSize: 615,
            },
            children: {
              '52823.141': {
                request: {
                  url: 'https://fonts.gstatic.com/s/materialicons/v143/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
                  startTime: 28_303.757_623,
                  endTime: 28_303.844_388,
                  responseReceivedTime: 28_303.820_133,
                  transferSize: 128_797,
                },
              },
            },
          },
          '52823.4': {
            request: {
              url: 'https://www.gstatic.com/devrel-devsite/prod/ve761bca974e16662f27aa8810df6d144acde5bdbeeca0dfd50e25f86621eaa19/chrome/css/app.css',
              startTime: 28_303.573_196,
              endTime: 28_303.643_246,
              responseReceivedTime: 28_303.593_019,
              transferSize: 136_789,
            },
          },
          '52823.5': {
            request: {
              url: 'https://www.gstatic.com/devrel-devsite/prod/ve761bca974e16662f27aa8810df6d144acde5bdbeeca0dfd50e25f86621eaa19/chrome/css/dark-theme.css',
              startTime: 28_303.573_293_999_998,
              endTime: 28_303.643_049,
              responseReceivedTime: 28_303.641_657,
              transferSize: 4072,
            },
          },
          '52823.6': {
            request: {
              url: 'https://developer.chrome.com/extras.css',
              startTime: 28_303.573_378,
              endTime: 28_303.772_705,
              responseReceivedTime: 28_303.771_657,
              transferSize: 109,
            },
          },
        },
      },
    },
    longestChain: {
      duration: 757.072_000_000_625_8,
      length: 3,
      transferSize: 128_797,
    },
  };

  it('should convert chains to basic trees', () => {
    expect(
      parseCriticalRequestChainToAuditDetails(details).trees,
    ).toMatchSnapshot();
  });

  it('should convert longest chain to table', () => {
    expect(
      parseCriticalRequestChainToAuditDetails(details).table,
    ).toMatchSnapshot();
  });
});
