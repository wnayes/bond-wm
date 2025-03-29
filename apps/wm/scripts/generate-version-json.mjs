#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

/** @returns {string} Short git hash from the latest commit. */
async function getGitVersionAsync() {
  return new Promise((resolve, reject) => {
    exec("git describe --long --always", function (err, stdout, stderr) {
      if (err || stderr) {
        reject("Git version failure: " + err + ", " + stderr);
        return;
      }

      resolve(stdout.trim());
    });
  });
}

const thisScriptPath = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = resolve(thisScriptPath, "../package.json");
const packageJsonText = readFileSync(packageJsonPath, "utf-8");
const packageJson = JSON.parse(packageJsonText);

const gitVersion = await getGitVersionAsync();

const version = `${packageJson.version}-${gitVersion}`;
const versionJson = { version };

const distPath = resolve(thisScriptPath, "../dist");
if (!existsSync(distPath)) {
  mkdirSync(distPath);
}

const versionJsonPath = resolve(thisScriptPath, "../dist/version.json");
writeFileSync(versionJsonPath, JSON.stringify(versionJson), "utf-8");

console.log(version);
