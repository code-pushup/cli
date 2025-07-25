#!/usr/bin/env node
import { externalFunction } from './lib/feature-1';
import { calculate } from './lib/utils/math';

// Bin-specific functionality
function binSpecificLogic(): string {
  const binMessage = 'This is bin.ts specific content';
  return `Bin: CLI Tool - Math: ${calculate(10, 2)} - ${binMessage}`;
}

function runBin(): void {
  console.log('Running from bin.ts');
  console.log(binSpecificLogic());
  console.log(
    `External: ${externalFunction(() => Promise.resolve({ chart: 'bin-chart' }))}`,
  );
}

runBin();
