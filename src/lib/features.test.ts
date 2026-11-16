import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractFeatures, predictKMeans, validateKMeans, FEATURE_VERSION } from './features.ts';

test('black and white images preserve histogram endpoints and zero texture', () => {
  for (const value of [0, 1]) {
    const features = extractFeatures(new Float32Array(3072).fill(value));
    assert.equal(features.length, 35);
    assert.deepEqual(features.slice(0, 3), [value, value, value]);
    assert.deepEqual(features.slice(3, 6), [0, 0, 0]);
    for (let channel = 0; channel < 3; channel++) {
      const histogram = features.slice(6 + channel * 8, 14 + channel * 8);
      assert.equal(histogram.reduce((s, v) => s + v, 0), 1);
      assert.equal(histogram[value === 0 ? 0 : 7], 1);
    }
    assert.ok(features.slice(30).every(v => Math.abs(v) < 1e-20));
  }
});

test('checkerboard has known gradient and laplacian statistics', () => {
  const rgb = Float32Array.from({ length: 3072 }, (_, i) => {
    const p = Math.floor(i / 3); return (p % 32 + Math.floor(p / 32)) % 2;
  });
  const f = extractFeatures(rgb);
  assert.deepEqual(f.slice(0, 6), [0.5,0.5,0.5,0.5,0.5,0.5]);
  assert.ok(Math.abs(f[30] - 1) < 1e-12);
  assert.ok(Math.abs(f[32] - 1) < 1e-12);
  assert.ok(Math.abs(f[34] - 16) < 1e-12);
});

test('cluster names follow exported mapping, including reversed mapping', () => {
  const a = validateKMeans({ schema_version: 1, feature_version: FEATURE_VERSION, input_size: 32,
    mean: Array(35).fill(0), scale: Array(35).fill(1),
    centers: [extractFeatures(new Float32Array(3072)), Array(35).fill(10)], cluster_to_class: [1,0] });
  const prediction = predictKMeans(new Float32Array(3072), a);
  assert.equal(prediction.cluster, 0); assert.equal(prediction.label, 'FAKE');
  assert.equal(prediction.distances[0], 0);
  assert.throws(() => validateKMeans({ ...a, scale: Array(35).fill(0) }));
});
