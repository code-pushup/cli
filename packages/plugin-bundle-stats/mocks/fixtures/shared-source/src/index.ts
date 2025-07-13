import { externalFunction } from './lib/feature-1';
import { calculate } from './lib/utils/math';

export default function main(): string {
  const loadDynamic = () => import('./lib/feature-2');
  const indexSpecificMessage = 'This is index.ts specific content';
  return `Bundle: - Math: ${calculate(5, 3)} - Dynamic: loaded - External: ${externalFunction(loadDynamic)} - ${indexSpecificMessage}`;
}

export function indexOnlyFunction(): string {
  return `Index-only`;
}
