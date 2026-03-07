/**
 * @fileoverview A helper script to extract catalog dependencies from a pnpm workspace file.
 */

import { readFileSync } from "node:fs";

/**
 * Creates a map of catalog dependencies from the pnpm workspace file.
 * @param {string} workspacePath The path to the pnpm workspace file.
 * @returns {Map<string, string>} A map of catalog dependencies.
 */
export function getPnpmCatalogDependencies(workspacePath) {
  const workspaceYaml = readFileSync(workspacePath, "utf-8");
  const lines = workspaceYaml.split(/\r?\n/);
  const catalogDependencies = new Map();

  let inCatalogSection = false;
  for (const line of lines) {
    if (!inCatalogSection) {
      if (/^catalog:\s*$/.test(line)) {
        inCatalogSection = true;
      }
      continue;
    }

    if (!line.trim() || /^\s*#/.test(line)) {
      continue;
    }
    if (!line.startsWith("  ")) {
      break;
    }

    const match = line.match(/^ {2}(.+?):\s*(.+?)\s*$/);
    if (!match) {
      continue;
    }

    let key = match[1].trim();
    const value = match[2].trim();

    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1);
    }

    catalogDependencies.set(key, value);
  }

  return catalogDependencies;
}
