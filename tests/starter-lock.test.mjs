import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scaffold } from '../skills/glowup-ui/scripts/scaffold.mjs';
import { DIRECTIONS } from '../skills/glowup-ui/scripts/directions.mjs';

test('every design direction produces a synchronized lock with only its selected fonts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'glowup-starter-lock-'));
  try {
    for (const direction of DIRECTIONS) {
      const dir = path.join(root, direction.id);
      scaffold({ name: 'Review Workspace', dir, direction: direction.id });
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json')));
      const lock = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json')));
      assert.equal(lock.name, 'review-workspace');
      assert.equal(lock.packages[''].name, manifest.name);
      assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
      assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies);
      for (const name of Object.keys(manifest.dependencies)) {
        assert.ok(lock.packages['node_modules/' + name]?.integrity, name + ' must be resolved');
      }
      const fonts = Object.keys(lock.packages).filter(name => name.startsWith('node_modules/@fontsource-variable/'));
      assert.equal(fonts.length, Object.keys(manifest.dependencies).filter(name => name.startsWith('@fontsource-variable/')).length);
      for (const name of fonts) assert.ok(manifest.dependencies[name.slice('node_modules/'.length)]);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
