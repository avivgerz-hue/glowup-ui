#!/usr/bin/env node
// Run every tests/*.test.mjs with the built-in test runner.
// Lists the files itself because `node --test` only expands globs on Node 21+,
// and a directory argument behaves differently on Node 20 and 22.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const testsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "tests");
const files = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => path.join(testsDir, name));

if (files.length === 0) {
  console.error(`No *.test.mjs files found in ${testsDir}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit" });
process.exit(result.status ?? 1);
