import { predictKMeans, validateKMeans, type KMeansArtifact } from './features';
import type { LayersModel } from '@tensorflow/tfjs';

export type Label = 'REAL' | 'FAKE';
export type ClassificationMetrics = {
  accuracy: number; precision: number; recall: number; f1: number;
  confusion_matrix: number[][]; roc_auc?: number; ari?: number; silhouette?: number | null;
};
export type Metrics = {
  schema_version: number; dataset: string; labels: string[];
  train_size: number; validation_size: number; test_size: number;
  cnn: ClassificationMetrics; kmeans: ClassificationMetrics;
};
export type Prediction = { label: Label; milliseconds: number; score?: number; cluster?: number; distances?: number[] };
export type Resource<T> = { value: T | null; error: string | null };
export type LoadedModels = { cnn: Resource<LayersModel>; kmeans: Resource<KMeansArtifact>; metrics: Resource<Metrics> };
const base = `${import.meta.env.BASE_URL}models/`;

async function fetchJSON(name: string): Promise<unknown> {
  const response = await fetch(`${base}${name}`);
  if (!response.ok) throw new Error(`Falta models/${name}. Instala la exportación de Colab y recarga la página.`);
  try { return await response.json(); }
  catch { throw new Error(`No se pudo leer models/${name}. Instala la exportación de Colab y recarga la página.`); }
}
function validateMetrics(value: unknown): Metrics {
  const m = value as Metrics;
  const valid = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
  if (!m || m.schema_version !== 1 || m.dataset !== 'CIFAKE' || !Array.isArray(m.labels) ||
      m.labels.join(',') !== 'REAL,FAKE' || ![m.train_size,m.validation_size,m.test_size].every(n => Number.isInteger(n) && n > 0) ||
      ![m.cnn,m.kmeans].every(v => v && [v.accuracy,v.precision,v.recall,v.f1].every(valid)) ||
      typeof m.kmeans.ari !== 'number' || !Number.isFinite(m.kmeans.ari) || m.kmeans.ari < -1 || m.kmeans.ari > 1 ||
      !(m.kmeans.silhouette === null || (typeof m.kmeans.silhouette === 'number' && Number.isFinite(m.kmeans.silhouette) && Math.abs(m.kmeans.silhouette) <= 1))) {
    throw new Error('Las métricas no tienen el formato esperado. Vuelve a exportarlas desde Colab.');
  }
  return m;
}
async function resource<T>(task: () => Promise<T>): Promise<Resource<T>> {
  try { return { value: await task(), error: null }; }
  catch (error) { return { value: null, error: error instanceof Error ? error.message : 'No se pudo cargar el modelo.' }; }
}
export async function loadModels(): Promise<LoadedModels> {
  const [cnn, kmeans, metrics] = await Promise.all([
    resource(async () => {
      // Check the manifest before importing TensorFlow: absence is a normal first-run state.
      const manifest = await fetchJSON('cnn/model.json');
      if (!manifest || typeof manifest !== 'object' || !('modelTopology' in manifest)) {
        throw new Error('El archivo de la CNN no es una exportación TensorFlow.js válida.');
      }
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      const model = await tf.loadLayersModel(`${base}cnn/model.json`);
      const shape = model.inputs[0].shape;
      if (model.inputs.length !== 1 || shape.length !== 4 || shape[1] !== 32 || shape[2] !== 32 || shape[3] !== 3 ||
          model.outputs.length !== 1 || model.outputs[0].shape.at(-1) !== 1) {
        model.dispose();
        throw new Error('La CNN debe recibir 32 × 32 × 3 y devolver un puntaje.');
      }
      return model;
    }),
    resource(async () => validateKMeans(await fetchJSON('kmeans.json'))),
    resource(async () => validateMetrics(await fetchJSON('metrics.json'))),
  ]);
  return { cnn, kmeans, metrics };
}
export async function predictCNN(rgb: Float32Array, model: LayersModel): Promise<Prediction> {
  const tf = await import('@tensorflow/tfjs');
  const start = performance.now();
  const input = tf.tensor4d(rgb, [1,32,32,3]);
  let output: ReturnType<LayersModel['predict']> | undefined;
  try {
    output = model.predict(input);
    if (Array.isArray(output)) throw new Error('La CNN devolvió múltiples salidas.');
    const score = (await output.data())[0];
    if (!Number.isFinite(score) || score < 0 || score > 1) throw new Error('La CNN devolvió un puntaje inválido.');
    return { label: score >= 0.5 ? 'FAKE' : 'REAL', score, milliseconds: performance.now() - start };
  } finally {
    input.dispose();
    if (Array.isArray(output)) output.forEach(t => t.dispose()); else output?.dispose();
  }
}
export function predictClustering(rgb: Float32Array, artifact: KMeansArtifact): Prediction {
  const start = performance.now();
  return { ...predictKMeans(rgb, artifact), milliseconds: performance.now() - start };
}
