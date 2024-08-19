export type PublishOptions = {
  projectName?: string;
  directory?: string;
  registry?: string;
  tag?: string;
  nextVersion: string;
  verbose: boolean;
};
export type BumpOptions = {
  nextVersion: string;
  verbose?: boolean;
  directory?: string;
};
