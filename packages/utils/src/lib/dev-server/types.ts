export type DevServerDetectionResult = {
  url: string;
  port: number;
  source: string;
};

export type DevServerDetector = {
  id: string;
  detect: (targetDir: string) => Promise<DevServerDetectionResult | null>;
};

export type DevServerUrlPrompt = {
  default: string;
  message: string;
};
