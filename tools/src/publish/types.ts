export type PublishOptions = {
  projectName?: string;
  directory?: string;
  userconfig?: string;
  registry?: string;
  tag?: string;
  nextVersion?: string;
  verbose?: boolean;
  parallel?: number;
};
export type BumpOptions = {
  nextVersion: string;
  verbose?: boolean;
  directory?: string;
};
