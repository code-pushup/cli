import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as utils from '@code-pushup/utils';
import type {
  MonorepoHandlerOptions,
  MonorepoHandlerProjectsContext,
  ProjectConfig,
} from '../tools';
import { nxHandler } from './nx';

describe('nxHandler', () => {
  const options: MonorepoHandlerOptions = {
    cwd: MEMFS_VOLUME,
    task: 'code-pushup',
    parallel: false,
    nxProjectsFilter: '--with-target={task}',
  };

  describe('isConfigured', () => {
    it('should detect Nx when nx.json exists and `nx report` succeeds', async () => {
      vol.fromJSON({ 'nx.json': '{}' }, MEMFS_VOLUME);
      vi.spyOn(utils, 'executeProcess').mockResolvedValue({
        code: 0,
        stdout: 'NX Report complete - copy this into the issue template',
      } as utils.ProcessResult);

      await expect(nxHandler.isConfigured(options)).resolves.toBe(true);
    });

    it("should NOT detect Nx when nx.json doesn't exist", async () => {
      vol.fromJSON({ 'turbo.json': '{}' }, MEMFS_VOLUME);
      vi.spyOn(utils, 'executeProcess').mockResolvedValue({
        code: 0,
      } as utils.ProcessResult);

      await expect(nxHandler.isConfigured(options)).resolves.toBe(false);
    });

    it('should NOT detect Nx when `nx report` fails with non-zero exit code', async () => {
      vol.fromJSON({ 'nx.json': '' }, MEMFS_VOLUME);
      vi.spyOn(utils, 'executeProcess').mockResolvedValue({
        code: 1,
        stderr: 'Error: ValueExpected in nx.json',
      } as utils.ProcessResult);

      await expect(nxHandler.isConfigured(options)).resolves.toBe(false);
    });
  });

  describe('listProjects', () => {
    beforeEach(() => {
      vi.spyOn(utils, 'executeProcess').mockResolvedValue({
        stdout: '["backend","frontend"]',
      } as utils.ProcessResult);
    });

    it('should list projects from `nx show projects`', async () => {
      await expect(nxHandler.listProjects(options)).resolves.toEqual([
        { name: 'backend', bin: 'npx nx run backend:code-pushup --' },
        { name: 'frontend', bin: 'npx nx run frontend:code-pushup --' },
      ] satisfies ProjectConfig[]);
    });

    it('should forward nxProjectsFilter option to `nx show projects`', async () => {
      await nxHandler.listProjects({
        ...options,
        nxProjectsFilter: ['--affected', '--exclude=*-e2e'],
      });

      expect(utils.executeProcess).toHaveBeenCalledWith({
        command: 'npx',
        args: [
          'nx',
          'show',
          'projects',
          '--affected',
          '--exclude=*-e2e',
          '--json',
        ],
        cwd: MEMFS_VOLUME,
      } satisfies utils.ProcessConfig);
    });

    it('should replace {task} in nxProjectsFilter with task option in `nx show projects` arguments', async () => {
      await nxHandler.listProjects({
        ...options,
        task: 'code-pushup',
        nxProjectsFilter: '--with-target={task}',
      });

      expect(utils.executeProcess).toHaveBeenCalledWith({
        command: 'npx',
        args: ['nx', 'show', 'projects', '--with-target=code-pushup', '--json'],
        cwd: MEMFS_VOLUME,
      } satisfies utils.ProcessConfig);
    });

    it('should throw if `nx show projects` outputs invalid JSON', async () => {
      vi.spyOn(utils, 'executeProcess').mockResolvedValue({
        stdout: 'backend\nfrontend\n',
      } as utils.ProcessResult);

      await expect(nxHandler.listProjects(options)).rejects.toThrow(
        "Invalid non-JSON output from 'nx show projects' - SyntaxError: Unexpected token",
      );
    });

    it("should throw if `nx show projects` JSON output isn't array of strings", async () => {
      vi.spyOn(utils, 'executeProcess').mockResolvedValue({
        stdout: '"backend"',
      } as utils.ProcessResult);

      await expect(nxHandler.listProjects(options)).rejects.toThrow(
        'Invalid JSON output from \'nx show projects\', expected array of strings, received "backend"',
      );
    });
  });

  describe('createRunManyCommand', () => {
    const projects: MonorepoHandlerProjectsContext = {
      all: [
        { name: 'backend', bin: 'npx nx run backend:code-pushup --' },
        { name: 'frontend', bin: 'npx nx run frontend:code-pushup --' },
      ],
    };

    it('should run script for all listed projects sequentially by default', () => {
      expect(nxHandler.createRunManyCommand(options, projects)).toBe(
        'npx nx run-many --targets=code-pushup --parallel=false --projects=backend,frontend --',
      );
    });

    it('should set parallel flag with default number of tasks', () => {
      expect(
        nxHandler.createRunManyCommand(
          { ...options, parallel: true },
          projects,
        ),
      ).toBe(
        'npx nx run-many --targets=code-pushup --parallel=true --projects=backend,frontend --',
      );
    });

    it('should set parallel flag with custom number of tasks', () => {
      expect(
        nxHandler.createRunManyCommand({ ...options, parallel: 5 }, projects),
      ).toBe(
        'npx nx run-many --targets=code-pushup --parallel=5 --projects=backend,frontend --',
      );
    });

    it('should filter projects by list of project names', () => {
      expect(
        nxHandler.createRunManyCommand(options, {
          ...projects,
          only: ['frontend'],
        }),
      ).toBe(
        'npx nx run-many --targets=code-pushup --parallel=false --projects=frontend --',
      );
    });
  });
});
