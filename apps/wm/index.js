// Bootstraps ts-node and loads the TypeScript main.ts entrypoint.
require("ts-node").register({
    cwd: __dirname,
    project: "./tsconfig.json",
    skipIgnore: true,
});
require("./main.ts");