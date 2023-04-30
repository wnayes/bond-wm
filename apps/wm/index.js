// Bootstraps ts-node and loads the TypeScript main.ts entrypoint.
require("ts-node").register({
    cwd: "./apps/wm",
    project: "./tsconfig.json"
});
require("./main.ts");