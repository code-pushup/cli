export type DOM = {
  append: (v: string) => string;
  createComponent: (type: 'crcChain', opt: Record<string, unknown>) => string;
};
