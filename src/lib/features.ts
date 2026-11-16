/** Must match features() in notebooks/real_o_ia.ipynb, including float32 inputs. */
export const FEATURE_VERSION = 'rgb-hist-gradient-laplacian-v1';
export const INPUT_SIZE = 32;
export type KMeansArtifact = {
  schema_version: number;
  feature_version: string;
  input_size: number;
  mean: number[];
  scale: number[];
  centers: number[][];
  cluster_to_class: number[];
};
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const variance = (values: number[]) => {
  const m = mean(values);
  return mean(values.map(value => (value - m) ** 2));
};

export function extractFeatures(rgb: Float32Array): number[] {
  if (rgb.length !== 32 * 32 * 3 || rgb.some(v => !Number.isFinite(v) || v < 0 || v > 1)) {
    throw new Error('Se requieren 32 × 32 píxeles RGB normalizados.');
  }
  const channels = [0, 1, 2].map(c => Array.from({ length: 1024 }, (_, i) => rgb[i * 3 + c]));
  const result = [...channels.map(mean), ...channels.map(c => Math.sqrt(variance(c)))];
  for (const channel of channels) {
    const histogram = Array<number>(8).fill(0);
    for (const value of channel) histogram[Math.min(Math.floor(value * 8), 7)] += 1 / 1024;
    result.push(...histogram);
  }
  const gray = Array.from({ length: 1024 }, (_, i) =>
    rgb[i * 3] * 0.299 + rgb[i * 3 + 1] * 0.587 + rgb[i * 3 + 2] * 0.114);
  const dx: number[] = [], dy: number[] = [], lap: number[] = [];
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const i = y * 32 + x;
    if (x < 31) dx.push(Math.abs(gray[i + 1] - gray[i]));
    if (y < 31) dy.push(Math.abs(gray[i + 32] - gray[i]));
    if (x > 0 && x < 31 && y > 0 && y < 31) {
      lap.push(gray[i - 32] + gray[i + 32] + gray[i - 1] + gray[i + 1] - 4 * gray[i]);
    }
  }
  result.push(mean(dx), Math.sqrt(variance(dx)), mean(dy), Math.sqrt(variance(dy)), variance(lap));
  return result;
}

export function validateKMeans(value: unknown): KMeansArtifact {
  const a = value as KMeansArtifact;
  const vector = (v: unknown): v is number[] => Array.isArray(v) && v.length === 35 && v.every(Number.isFinite);
  if (!a || a.schema_version !== 1 || a.feature_version !== FEATURE_VERSION || a.input_size !== 32 ||
      !vector(a.mean) || !vector(a.scale) || a.scale.some(v => v <= 0) ||
      !Array.isArray(a.centers) || a.centers.length !== 2 || !a.centers.every(vector) ||
      !Array.isArray(a.cluster_to_class) || a.cluster_to_class.length !== 2 ||
      [...a.cluster_to_class].sort().join(',') !== '0,1') {
    throw new Error('El archivo de k-means no corresponde a este prototipo. Vuelve a exportarlo desde Colab.');
  }
  return a;
}

export function predictKMeans(rgb: Float32Array, artifact: KMeansArtifact) {
  const features = extractFeatures(rgb);
  const z = features.map((v, i) => (v - artifact.mean[i]) / artifact.scale[i]);
  const distances = artifact.centers.map(center => Math.sqrt(center.reduce((sum, v, i) => sum + (v - z[i]) ** 2, 0)));
  const cluster = distances[0] <= distances[1] ? 0 : 1;
  return { cluster, label: artifact.cluster_to_class[cluster] === 0 ? 'REAL' as const : 'FAKE' as const, distances };
}
