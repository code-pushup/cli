import { mockCoreConfig } from '@code-pushup/models/testing';
import { CommandBaseOptions } from '../src/lib/implementation/model';

export function commandBaseOptionsMock(): CommandBaseOptions {
  return { ...mockCoreConfig(), verbose: false };
}
