#!/usr/bin/env node
"use strict";

import { existsSync } from "node:fs";
import { join } from "node:path";
import { env } from "node:process";
import * as ChildProcess from "node:child_process";
import prompts from "prompts";

const RemoteRepo = "https://github.com/wnayes/electron-wm.git";
const Templates = ["react"];
const XDGHome = getXDGHome();
const DefaultConfigDirectoryName = "electron-wm-config";
const DefaultConfigDirectoryPath = join(XDGHome, DefaultConfigDirectoryName);

(async () => {
  const alreadyExists = existsSync(DefaultConfigDirectoryPath);
  if (alreadyExists) {
    console.log(`Default config directory already exists at ${DefaultConfigDirectoryPath}.`);
  }

  const response = await prompts([
    {
      type: "text",
      name: "directory",
      message: alreadyExists ? "config location: " : `config location: (${DefaultConfigDirectoryPath}) `,
    },
    {
      type: "text",
      name: "template",
      message: `template: (${Templates[0]}) `,
    },
  ]);

  if (!response.directory) {
    if (alreadyExists) {
      console.error("No config location was specified.");
      process.exit();
    } else {
      response.directory = DefaultConfigDirectoryPath;
    }
  } else if (existsSync(response.directory)) {
    console.error(`Config location ${response.directory} already exists. Specify a new directory to create.`);
    process.exit();
  }

  if (!response.template) {
    response.template = Templates[0];
  } else if (Templates.indexOf(response.template) === -1) {
    console.error(`Template ${response.template} was not recognized.\nValid templates are: ${Templates.join(", ")}`);
    process.exit();
  }

  ChildProcess.execSync(
    `git clone --single-branch --branch ${response.template}-config-release ${RemoteRepo} ${response.directory}`
  );

  console.log(`Config git repository created at ${response.directory}`);
})();

function getXDGHome() {
  let XDG_CONFIG_HOME = env["XDG_CONFIG_HOME"];
  if (!XDG_CONFIG_HOME) {
    const HOME = env["HOME"] || "~";
    XDG_CONFIG_HOME = join(HOME, ".config");
  }
  return XDG_CONFIG_HOME;
}
