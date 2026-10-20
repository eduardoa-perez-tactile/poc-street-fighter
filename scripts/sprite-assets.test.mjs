import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

// Inspect the actual imported pixels: valid frame metadata alone cannot detect
// a crop aimed at an empty part of a source sheet. No engine or Pillow required.
function alphaBounds(path) {
  const png = readFileSync(path), compressed = [];
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', path);
  let width, height;
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset), kind = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      assert.equal(data[8], 8, `${path}: expected 8-bit imported pixels`);
      assert.equal(data[9], 6, `${path}: expected RGBA imported pixels`);
      assert.equal(data[12], 0, `${path}: unexpected interlaced image`);
    }
    if (kind === 'IDAT') compressed.push(data);
    offset += length + 12;
  }
  const raw = inflateSync(Buffer.concat(compressed)), stride = width * 4;
  assert.equal(raw.length, (stride + 1) * height, path);
  let previous = Buffer.alloc(stride), bounds = null;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], row = Buffer.alloc(stride);
    assert.ok(filter <= 4, `${path}: unsupported PNG filter`);
    for (let byte = 0; byte < stride; byte++) {
      const left = byte >= 4 ? row[byte - 4] : 0, up = previous[byte], corner = byte >= 4 ? previous[byte - 4] : 0;
      const prediction = left + up - corner;
      const a = Math.abs(prediction - left), b = Math.abs(prediction - up), c = Math.abs(prediction - corner);
      const paeth = a <= b && a <= c ? left : b <= c ? up : corner;
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth][filter];
      row[byte] = (raw[y * (stride + 1) + 1 + byte] + predictor) & 255;
      if (byte % 4 === 3 && row[byte] > 0) {
        const x = (byte - 3) / 4;
        if (!bounds) bounds = [x, y, x, y];
        else bounds = [Math.min(bounds[0], x), Math.min(bounds[1], y), Math.max(bounds[2], x), Math.max(bounds[3], y)];
      }
    }
    previous = row;
  }
  return { width, height, bounds };
}

test('imported fighter and effect sprites contain visible pixels and valid sidecars', () => {
  const problems = [];
  for (const folder of ['assets/fighters/ryu', 'assets/fighters/ken', 'assets/effects']) {
    for (const name of readdirSync(folder).filter(name => name.endsWith('.png'))) {
      const path = `${folder}/${name}`, image = alphaBounds(path);
      assert.ok(existsSync(`${path}.gmeta`), `${path}: missing importer sidecar`);
      // The pinned original explicitly alternates this empty frame with the two
      // fireball poses to create its flicker. It is the only intentional blank.
      if (path === 'assets/effects/hadouken-fireball-3.png') {
        assert.equal(image.bounds, null, 'original Hadouken flicker frame changed');
        continue;
      }
      if (!image.bounds) problems.push(`${path}: crop is fully transparent`);
      if (folder.includes('/fighters/')) {
        assert.equal(image.width, 256, path); assert.equal(image.height, 256, path);
        if (image.bounds && (image.bounds[0] === 0 || image.bounds[1] === 0 || image.bounds[2] === 255 || image.bounds[3] === 255)) {
          problems.push(`${path}: visible pixels touch the canvas boundary; check clipping/pivot`);
        }
      }
    }
  }
  assert.deepEqual(problems, []);
});
