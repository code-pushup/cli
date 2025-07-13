/**
 * Generates mermaid chart with scoring data visualization. Provides customizable title and line data for performance analysis.
 * @param {Object} options - Chart configuration options
 * @param {string} options.title - Chart title
 * @param {Array<{name: string, data: number[]}>} options.lines - Array of line objects with name and data arrays of any length
 * @returns {string} Mermaid chart markdown string
 */
export function createScoringChart(options) {
  const { title, lines } = options;

  const MAX_VALUE = 10;
  const TICK_COUNT = 10;

  const xAxisValues = Array.from({ length: TICK_COUNT }, (_, i) =>
    ((i * MAX_VALUE) / (TICK_COUNT - 1)).toFixed(1),
  );
  const xAxisFormatted = `["${xAxisValues.join('","')}"]`;

  const formattedLines = lines
    .map(line => {
      const projectedData = projectToTenPoints(line.data);
      const cleanedData = projectedData.map(val => parseFloat(val.toFixed(2)));
      const dataFormatted = `[${cleanedData.join(',')}]`;
      const cleanLineName = line.name.replace(/[()]/g, '').replace(/\s+/g, '_');
      return `    line ${cleanLineName} ${dataFormatted}`;
    })
    .join('\n');

  return `\`\`\`mermaid
xychart-beta
    title "${title}"
    x-axis ${xAxisFormatted}
    y-axis "Score" 0 --> 1
${formattedLines}
\`\`\``;
}

/**
 * Projects data array to exactly 10 points using linear interpolation. Ensures consistent chart display regardless of input size.
 */
function projectToTenPoints(data) {
  if (data.length === 10) return data;

  const result = [];
  for (let i = 0; i < 10; i++) {
    const position = (i / 9) * (data.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);

    if (lowerIndex === upperIndex) {
      result.push(data[lowerIndex]);
    } else {
      const fraction = position - lowerIndex;
      const interpolated =
        data[lowerIndex] + (data[upperIndex] - data[lowerIndex]) * fraction;
      result.push(parseFloat(interpolated.toFixed(2)));
    }
  }
  return result;
}

// Example usage:
// const chartMarkdown = createScoringChart({
//   title: "Score vs Artifact Size (with penalty shift)",
//   lines: [
//     { name: "Original", data: [1, 1, 1, 1, 1, 0.89, 0.67, 0.44, 0.22, 0] },
//     { name: "Penalized", data: [0.5, 0.5, 0.5, 0.5, 0.5, 0.39, 0.17, 0, 0, 0] }
//   ]
// });
// console.log(chartMarkdown);
