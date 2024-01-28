    const userDataDir = (process.argv as any).p || USER_DATA_DIR;
    console.info('userDataDir: ', userDataDir);
    const url = (process.argv as any)[2] || '';
    console.info('URL: ', process.argv);
    createBookmarkFile({
        bookmarkBar: loadSnippets(SNIPPETS_ROOT)
            .map(({fileName, javascript}) => ({name: toBookletName(dirname(fileName)), javascript})),
        userDataDir
    });
