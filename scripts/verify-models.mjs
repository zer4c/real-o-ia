/** Compare Colab's exported parity input against actual browser-format weights. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import * as tf from '@tensorflow/tfjs';
import { extractFeatures, predictKMeans, validateKMeans } from '../src/lib/features.ts';

const root = resolve('public/models');
const json = async name => JSON.parse(await readFile(resolve(root, name), 'utf8'));
const parity = await json('parity.json');
const km = validateKMeans(await json('kmeans.json'));
const rgb = Float32Array.from(parity.rgb, v => v / 255);
const features = extractFeatures(rgb);
const result = predictKMeans(rgb, km);
const featureError = Math.max(...features.map((v, i) => Math.abs(v - parity.features[i])));
const distanceError = Math.max(...result.distances.map((v, i) => Math.abs(v - parity.distances[i])));
assert.ok(featureError < 1e-8, `Feature mismatch: ${featureError}`);
assert.ok(distanceError < 1e-6, `Distance mismatch: ${distanceError}`);

const manifest = await json('cnn/model.json');
const specs = [], buffers = [];
for (const group of manifest.weightsManifest) {
  specs.push(...group.weights);
  for (const shard of group.paths) {
    const path = resolve(root, 'cnn', shard);
    assert.ok(path.startsWith(root + sep), 'Invalid weight path');
    buffers.push(await readFile(path));
  }
}
const bytes = Buffer.concat(buffers);
await tf.setBackend('cpu');
const model = await tf.loadLayersModel(tf.io.fromMemory({
  modelTopology: manifest.modelTopology,
  weightSpecs: specs,
  weightData: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
}));
const input = tf.tensor4d(rgb, [1, 32, 32, 3]);
const output = model.predict(input);
const score = (await output.data())[0];
const cnnError = Math.abs(score - parity.cnn_score);
assert.ok(cnnError < 1e-4, `CNN score mismatch: ${cnnError}`);
input.dispose(); output.dispose(); model.dispose();
console.log(JSON.stringify({ featureMaxError: featureError, distanceMaxError: distanceError,
  cnnScore: score, colabCnnScore: parity.cnn_score, cnnAbsoluteError: cnnError,
  kmeansCluster: result.cluster, kmeansLabel: result.label, remainingTensors: tf.memory().numTensors }, null, 2));
