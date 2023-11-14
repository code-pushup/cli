export type Observer = {
  next?: (value: unknown) => void;
  error?: (error: unknown) => void;
  complete?: () => void;
};
