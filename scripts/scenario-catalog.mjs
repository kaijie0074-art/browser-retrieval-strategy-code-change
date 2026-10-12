export const scenarios = {
  'baseline-raw-query': {
    rawQuery: ' Browser   Retrieval ',
    strategy: 'baseline',
    expectedStop: 'success',
    expectedResults: 0,
  },
  'query-normalization': {
    rawQuery: ' Browser   Retrieval ',
    strategy: 'strategy-v2',
    expectedStop: 'success',
    expectedResults: 2,
  },
  'fallback-503': {
    rawQuery: 'fallback',
    strategy: 'strategy-v2',
    expectedStop: 'success',
    expectedResults: 1,
  },
  'rate-limit-no-fallback': {
    rawQuery: 'rate limit',
    strategy: 'strategy-v2',
    expectedStop: 'rate-limited',
    expectedResults: 0,
  },
  'semantic-empty-no-fallback': {
    rawQuery: 'empty',
    strategy: 'strategy-v2',
    expectedStop: 'semantic-empty',
    expectedResults: 0,
  },
  'repeated-cursor': {
    rawQuery: 'paged-loop',
    strategy: 'strategy-v2',
    expectedStop: 'repeated-cursor',
    expectedResults: 1,
  },
};
