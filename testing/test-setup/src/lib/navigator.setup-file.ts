beforeEach(() => {
  vi.stubGlobal('navigator', {
    hardwareConcurrency: 1,
  });
});
