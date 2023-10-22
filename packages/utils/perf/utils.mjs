export function toStringBench() {
  var bench = this,
    error = bench.error,
    hz = bench.hz,
    id = bench.id,
    stats = bench.stats,
    size = stats.sample.length,
    pm = '\xb1',
    result = bench.name || (_.isNaN(id) ? id : '<Test #' + id + '>');

  if (error) {
    var errorStr;
    if (!_.isObject(error)) {
      errorStr = String(error);
    } else if (!_.isError(Error)) {
      errorStr = join(error);
    } else {
      // Error#name and Error#message properties are non-enumerable.
      errorStr = join(
        _.assign({ name: error.name, message: error.message }, error),
      );
    }
    result += ': ' + errorStr;
  } else {
    result +=
      ' x ' +
      formatNumber(hz.toFixed(hz < 100 ? 2 : 0)) +
      ' ops/sec ' +
      pm +
      stats.rme.toFixed(2) +
      '% (' +
      size +
      ' run' +
      (size == 1 ? '' : 's') +
      ' sampled)';
  }
  return result;
}
