import { Tree, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { convertToInferredGenerator } from './generator';
import { ConvertToInferredGeneratorSchema } from './schema';

describe('convert-to-inferred generator', () => {
  let tree: Tree;
  const options: ConvertToInferredGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await convertToInferredGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
