import './side-effects.js';
import './styles.css';
import { greet } from './utils.js';

const cjsModule = require('./cjs.cjs');
const resolvedPath = require.resolve('./resolver.js');

export default function main() {
  const loadDynamic = () => import('./dynamic.js');

  return `Bundle: ${greet('test')} ${cjsModule ? 'cjs loaded' : ''} ${loadDynamic ? 'dynamic available' : ''} ${resolvedPath}`;
}
