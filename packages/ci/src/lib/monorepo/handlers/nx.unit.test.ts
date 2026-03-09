import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as utils from '@code-pushup/utils';
import type {
  MonorepoHandlerOptions,
  MonorepoHandlerProjectsContext,
  ProjectConfig,
} from '../tools.js';
import { nxHandler } from './nx.js';

describe('nxHandler', () => {
  const options: MonorepoHandlerOptions = {
    cwd: MEMFS_VOLUME,
    task: 'code-pushup',
    parallel: false,
    nxProjectsFilter: '--with-target={task}',
  };

  describe('listProjects', () => {
    const nxReportSuccess = { code: 0 } as utils.ProcessResult;

    beforeEach(() => {
      vi.spyOn(utils, 'executeProcess')
        .mockResolvedValueOnce(nxReportSuccess)
        .mockResolvedValueOnce({
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

    it('should throw if `nx report` fails', async () => {
      vi.spyOn(utils, 'executeProcess')
        .mockReset()
        .mockResolvedValueOnce({
          code: 1,
          stderr: 'Error: ValueExpected in nx.json',
        } as utils.ProcessResult);

      await expect(nxHandler.listProjects(options)).rejects.toThrow(
        "'nx report' failed with exit code 1 - Error: ValueExpected in nx.json",
      );
    });

    it('should throw if `nx show projects` outputs invalid JSON', async () => {
      vi.spyOn(utils, 'executeProcess')
        .mockReset()
        .mockResolvedValueOnce(nxReportSuccess)
        .mockResolvedValueOnce({
          stdout: 'backend\nfrontend\n',
        } as utils.ProcessResult);

      await expect(nxHandler.listProjects(options)).rejects.toThrow(
        "Invalid non-JSON output from 'nx show projects' - SyntaxError: Unexpected token",
      );
    });

    it("should throw if `nx show projects` JSON output isn't array of strings", async () => {
      vi.spyOn(utils, 'executeProcess')
        .mockReset()
        .mockResolvedValueOnce(nxReportSuccess)
        .mockResolvedValueOnce({
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
