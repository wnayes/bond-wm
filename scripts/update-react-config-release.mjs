#!/usr/bin/env node
"use strict";

// A release script that prepares the react-config-release git branch.
// 1. Run this script.
// 2. `cd .branches/react-config-release`
// 3. `git status` and confirm staged changes are appropriate.
// 4. Commit the changes.
// 5. `git push` will push into the top level electron-wm .git repo.
// 6. `cd ../..`
// 7. `git push origin react-config-release`

import * as ChildProcess from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PackageFolder = join(process.cwd(), "./packages/react-config");
const BranchesFolder = "./.branches";
const BranchName = "react-config-release";
const CheckoutFolder = join(process.cwd(), BranchesFolder, BranchName);
const DotGitFolder = join(CheckoutFolder, ".git");

const wmPackageJson = JSON.parse(readFileSync("./apps/wm/package.json", "utf-8"));
if (!wmPackageJson || wmPackageJson.name !== "electron-wm") {
  console.error("Unexpected working directory");
  process.exit();
}

if (!existsSync(BranchesFolder)) {
  mkdirSync(BranchesFolder);
}
if (!existsSync(CheckoutFolder)) {
  mkdirSync(CheckoutFolder);
}
console.log(CheckoutFolder);

if (!existsSync(DotGitFolder)) {
  ChildProcess.execSync(`git clone -l -n . ${CheckoutFolder}`);
}

try {
  ChildProcess.execSync(`git checkout ${BranchName}`, { cwd: CheckoutFolder });
} catch {
  ChildProcess.execSync(`git checkout --orphan ${BranchName}`, { cwd: CheckoutFolder });
}

ChildProcess.execSync(`git rm -rf .`, { cwd: CheckoutFolder });

cpSync(PackageFolder, CheckoutFolder, {
  recursive: true,
  force: true,
  filter: (src) => {
    if (src.includes("node_modules") || src.includes(".turbo")) {
      return false;
    }
    return true;
  },
});

function getPackageVersions() {
  const versions = {};

  const packageDirectories = ["packages", "apps"];
  for (const packagesFolderName of packageDirectories) {
    for (const packageName of readdirSync(join(process.cwd(), packagesFolderName), { recursive: false })) {
      const packageJsonPath = join(process.cwd(), packagesFolderName, packageName, "package.json");
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath));
        if (packageJson.name && packageJson.version) {
          versions[packageJson.name] = packageJson.version;
        }
      }
    }
  }

  return versions;
}

const CheckoutPackageJsonPath = join(CheckoutFolder, "package.json");
const checkoutPackageJson = JSON.parse(readFileSync(CheckoutPackageJsonPath));

const packageVersions = getPackageVersions();

function replaceWorkspaceDependencies(collectionName) {
  for (const depName in checkoutPackageJson[collectionName]) {
    if (checkoutPackageJson[collectionName][depName] === "workspace:^") {
      if (depName in packageVersions) {
        checkoutPackageJson[collectionName][depName] = `^${packageVersions[depName]}`;
      } else {
        console.error(`Workspace package ${depName} was unrecognized`);
      }
    }
  }
}

replaceWorkspaceDependencies("dependencies");
replaceWorkspaceDependencies("devDependencies");
replaceWorkspaceDependencies("peerDependencies");

const newCheckoutPackageJson = JSON.stringify(checkoutPackageJson, undefined, 2);
writeFileSync(CheckoutPackageJsonPath, newCheckoutPackageJson, "utf-8");

ChildProcess.execSync(`git add .`, { cwd: CheckoutFolder });
