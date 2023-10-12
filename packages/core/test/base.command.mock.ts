import { mockCoreConfig } from '@code-pushup/models/testing';
import { BaseOptions } from '../src/lib/implementation/model';

export function commandBaseOptionsMock(): BaseOptions {
  return { ...mockCoreConfig(), verbose: false };
}
