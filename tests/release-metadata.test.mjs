import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseSkillFile } from '../lib/frontmatter.mjs';
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
test('installer package, plugin and canonical skill advertise the same release version', () => {
  const version = JSON.parse(read('package.json')).version;
  assert.match(version, /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/);
  assert.equal(JSON.parse(read('.claude-plugin/plugin.json')).version, version);
  assert.equal(parseSkillFile(read('skills/glowup-ui/SKILL.md')).data.metadata.version, version);
});
