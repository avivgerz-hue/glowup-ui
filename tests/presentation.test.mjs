import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root));
function png(file) {
  const bytes = read(file);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], file);
  assert.ok(bytes.length < 180_000, `${file}: keep preview assets lightweight`);
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    assert.ok(offset + length + 12 <= bytes.length, `${file}: truncated PNG`);
    chunks.push(bytes.toString('ascii', offset + 4, offset + 8));
    offset += length + 12;
  }
  assert.equal(chunks[0], 'IHDR');
  assert.equal(chunks.at(-1), 'IEND');
  for (const privateMetadata of ['tEXt', 'iTXt', 'zTXt', 'eXIf']) assert.ok(!chunks.includes(privateMetadata), `${file}: embedded metadata`);
  return { bytes, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('gallery captures have matching dimensions, hashes and explicit non-benchmark provenance', () => {
  const evidence = JSON.parse(read('assets/examples/evidence.json'));
  assert.equal(evidence.pass, true);
  assert.match(evidence.kind, /not native activation or a model A\/B benchmark/);
  assert.equal(evidence.captures.length, 8);
  for (const device of ['desktop', 'mobile']) {
    for (const label of ['create', 'transform-before', 'transform-after', 'refine-after']) {
      const file = `${label}-${device}.png`;
      const capture = evidence.captures.find(item => item.file === file);
      assert.ok(capture, file);
      const image = png('assets/examples/' + file);
      assert.deepEqual([image.width, image.height], device === 'desktop' ? [1440, 900] : [390, 844]);
      assert.deepEqual([capture.width, capture.height], [image.width, image.height]);
      assert.equal(crypto.createHash('sha256').update(image.bytes).digest('hex'), capture.sha256, file);
    }
  }
  assert.equal(evidence.sources.refine.preservationPassed, true);
  assert.match(evidence.sources.refine.provenance, /Scripted/);
});

test('original brand assets have accessible labels and no active or external content', () => {
  for (const file of ['hero.svg', 'hero-mobile.svg', 'mark.svg', 'social-preview.svg']) {
    const svg = read('assets/brand/' + file).toString();
    assert.ok(Buffer.byteLength(svg) < 10_000, file);
    assert.match(svg, /<title[ >]/);
    assert.doesNotMatch(svg, /<script|<foreignObject|<image|\bon\w+\s*=|(?:href|url)\s*(?:=|\()\s*["']?(?:https?:|data:|\/\/)/i);
  }
});

test('social card and plugin icon use the expected dimensions without private PNG metadata', () => {
  for (const [file, width, height] of [['assets/brand/social-preview.png', 1280, 640], ['.claude-plugin/icon.png', 512, 512]]) {
    const image = png(file);
    assert.deepEqual([image.width, image.height], [width, height]);
  }
});
