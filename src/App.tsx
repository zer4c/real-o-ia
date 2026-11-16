import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { prepareImage, type PreparedImage } from './lib/image';
import { loadModels, predictCNN, predictClustering, type LoadedModels, type Prediction } from './lib/models';

type Theme = 'dark' | 'light';
type ImageSelection = PreparedImage & { file: File; url: string };
type Result = { value: Prediction | null; error: string | null };
// Presentation only: keep k-means available for restoring the comparison.
const SHOW_KMEANS = false;
const emptyResult = (): Result => ({ value: null, error: null });
const percent = (n?: number) => n === undefined ? '—' : `${(n * 100).toFixed(1)} %`;
const decimal = (n?: number) => n === undefined ? '—' : n.toFixed(3);
const message = (error: unknown) => error instanceof Error ? error.message : 'No se pudo analizar la imagen. Vuelve a intentarlo.';

function Icon({ name, className = '' }: { name: 'image' | 'upload' | 'sun' | 'moon' | 'clear' | 'arrow'; className?: string }) {
  const paths: Record<typeof name, ReactNode> = {
    image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m3 17 5-5 4 4 5-6 4 5" /></>,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    moon: <path d="M20.8 13.2A9 9 0 0 1 10.8 3.2a9 9 0 1 0 10 10Z" />,
    clear: <path d="m7 7 10 10M7 17 17 7" />,
    arrow: <path d="M12 4v16m-5-5 5 5 5-5" />,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Metric({ name, value, title }: { name: string; value: string; title?: string }) {
  return <tr className="metric" title={title}><th scope="row">{name}</th><td>{value}</td></tr>;
}

function ModelColumn({ kind, result, metrics, loading, busy, unavailable }: {
  kind: 'cnn' | 'kmeans'; result: Result; metrics: LoadedModels['metrics']['value']; loading: boolean; busy: boolean; unavailable: boolean;
}) {
  const isCNN = kind === 'cnn';
  const prediction = result.value;
  const modelMetrics = metrics?.[kind];
  const status = busy ? 'Analizando imagen…' : prediction ? (prediction.label === 'REAL' ? 'Real' : 'Generada por IA') : 'Sin predicción';
  return <article className={`model-column ${kind}`} aria-labelledby={`${kind}-heading`} aria-busy={busy}>
    <table className="model-table">
      <thead><tr>
        <td aria-hidden="true" />
        <th scope="col" className="model-heading">
          <h2 id={`${kind}-heading`}>{isCNN ? 'Red convolucional' : 'K-means'}</h2>
          <span className="model-tag">{isCNN ? 'Supervisado' : 'No supervisado'}</span>
        </th>
      </tr></thead>
      <tbody>
        <tr className="prediction-row"><th scope="row">Predicción</th>
          <td className={`prediction ${prediction ? prediction.label.toLowerCase() : 'pending'}`} aria-live="polite">{status}</td>
        </tr>
        <Metric name="Accuracy" value={loading ? '…' : percent(modelMetrics?.accuracy)} title="Exactitud del modelo en el conjunto de test; no corresponde a esta imagen." />
        <Metric name="F1" value={loading ? '…' : decimal(modelMetrics?.f1)} title="F1 de la clase FAKE en el conjunto de test." />
        <tr className="detail-row"><th scope="row">Detalle</th><td>
          {isCNN ? <span title="Salida sin calibrar de la CNN; umbral de clasificación: 0.5.">Puntaje FAKE <span className="detail-value">{percent(prediction?.score)}</span></span> : <>
            <span title="Grupo asociado a REAL/FAKE usando etiquetas de entrenamiento.">Grupo <span className="detail-value">{prediction?.cluster === undefined ? '—' : `${prediction.cluster} · ${prediction.label}`}</span></span>
            <span title="Distancia euclídea al centroide; no es una probabilidad.">Distancia <span className="detail-value">{prediction?.distances ? decimal(prediction.distances[prediction.cluster!]) : '—'}</span></span>
          </>}
        </td></tr>
      </tbody>
    </table>
    {result.error && <p className="inline-error" role="alert">{result.error}</p>}
    {unavailable && !result.error && <p className="model-note">Modelo pendiente de cargar.</p>}
  </article>;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  const [models, setModels] = useState<LoadedModels | null>(null);
  const [selection, setSelection] = useState<ImageSelection | null>(null);
  const [cnn, setCNN] = useState<Result>(emptyResult);
  const [kmeans, setKmeans] = useState<Result>(emptyResult);
  const [preparing, setPreparing] = useState(false);
  const [cnnBusy, setCNNBusy] = useState(false);
  const [kmBusy, setKMBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const version = useRef(0);
  const originalURL = useRef<string | null>(null);
  const loaded = useRef<LoadedModels | null>(null);

  useEffect(() => {
    let active = true;
    void loadModels().then(result => {
      if (!active) { result.cnn.value?.dispose(); return; }
      loaded.current = result;
      setModels(result);
    });
    return () => {
      active = false;
      version.current++;
      if (originalURL.current) URL.revokeObjectURL(originalURL.current);
      loaded.current?.cnn.value?.dispose();
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101614' : '#fafafa');
    try { localStorage.setItem('real-o-ia-theme', theme); } catch { /* Preference still applies for this session. */ }
  }, [theme]);

  useEffect(() => {
    if (!selection || !models) return;
    let active = true;
    const request = version.current;
    let timer: number | undefined;
    setCNN(emptyResult()); setKmeans(emptyResult());
    if (models.kmeans.value) {
      setKMBusy(true);
      // Allow the browser to paint the new preview before inference.
      const artifact = models.kmeans.value;
      timer = window.setTimeout(() => {
        if (!active || request !== version.current) return;
        try { setKmeans({ value: predictClustering(selection.rgb, artifact), error: null }); }
        catch (e) { setKmeans({ value: null, error: message(e) }); }
        finally { setKMBusy(false); }
      }, 0);
    }
    if (models.cnn.value) {
      setCNNBusy(true);
      void predictCNN(selection.rgb, models.cnn.value).then(value => {
        if (active && request === version.current) setCNN({ value, error: null });
      }).catch(e => {
        if (active && request === version.current) setCNN({ value: null, error: message(e) });
      }).finally(() => { if (active && request === version.current) setCNNBusy(false); });
    }
    return () => { active = false; window.clearTimeout(timer); };
  }, [selection, models]);

  async function selectFile(file?: File) {
    if (!file) return;
    const request = ++version.current;
    setPreparing(true); setError(null); setDragging(false);
    setSelection(null); setCNN(emptyResult()); setKmeans(emptyResult()); setCNNBusy(false); setKMBusy(false);
    if (originalURL.current) { URL.revokeObjectURL(originalURL.current); originalURL.current = null; }
    try {
      const image = await prepareImage(file);
      if (request !== version.current) return;
      const url = URL.createObjectURL(file);
      originalURL.current = url;
      setSelection({ ...image, file, url });
    } catch (e) { if (request === version.current) setError(message(e)); }
    finally { if (request === version.current) setPreparing(false); }
  }
  function clear() {
    version.current++;
    setSelection(null); setCNN(emptyResult()); setKmeans(emptyResult()); setError(null);
    setPreparing(false); setCNNBusy(false); setKMBusy(false); setDragging(false);
    if (originalURL.current) { URL.revokeObjectURL(originalURL.current); originalURL.current = null; }
    if (fileInput.current) fileInput.current.value = '';
  }
  const agreement = cnn.value && kmeans.value ? cnn.value.label === kmeans.value.label : null;
  const agreementText = agreement === true ? 'Ambos modelos coinciden' : agreement === false ? 'Los modelos no coinciden'
    : preparing || cnnBusy || kmBusy ? 'Analizando la imagen' : selection ? 'Esperando ambos resultados' : 'Esperando una imagen';
  const missing = models && (!models.cnn.value || (SHOW_KMEANS && !models.kmeans.value));

  return <>
    <header className="topbar"><div className="topbar-inner">
      <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
    </div></header>
    <main className="workspace" id="main">
      <section className="image-workspace" aria-label="Imagen de entrada">
        <input className="visually-hidden" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Seleccionar imagen JPG, PNG o WebP"
          onChange={event => { void selectFile(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} tabIndex={-1} />
        <button type="button" className={`dropzone ${dragging ? 'dragging' : ''} ${selection ? 'has-image' : ''}`}
          aria-label={selection ? 'Cambiar imagen' : 'Subir una imagen para comenzar'} onClick={() => fileInput.current?.click()}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
          onDrop={event => { event.preventDefault(); if (event.dataTransfer.files.length > 1) { setDragging(false); setError('Selecciona una sola imagen para comparar los modelos.'); return; } void selectFile(event.dataTransfer.files[0]); }}>
          {selection ? <img className="original-image" src={selection.url} alt={`Imagen seleccionada: ${selection.file.name}`} /> : <span className="dropzone-content">
            <Icon name="image" className="image-icon" />
            <span className="upload-prompt">{preparing ? 'Preparando imagen…' : dragging ? 'Suelta aquí tu imagen' : 'Sube una imagen para comenzar'}</span>
            <span className="upload-hint">JPG, PNG o WebP · hasta 15 MB</span>
          </span>}
        </button>
        {error && <p className="inline-error upload-error" role="alert">{error}</p>}
        <div className="image-bottom">
          <div className="input-preview">
            <div className="thumbnail" aria-label="Vista de la entrada del modelo">
              {selection ? <img src={selection.preview} alt="Entrada de 32 por 32 píxeles que reciben ambos modelos" /> : <Icon name="image" />}
            </div>
            <div className="preview-label"><p>Entrada del modelo <span>· 32 × 32</span></p>
              {selection && <span className="file-name" title={selection.file.name}>{selection.file.name}</span>}
            </div>
          </div>
          <div className="image-actions">
            <button className="button primary" type="button" onClick={() => fileInput.current?.click()}><Icon name="upload" />Subir imagen</button>
            <button className="button secondary" type="button" onClick={clear} disabled={!selection && !preparing && !error}><Icon name="clear" />Limpiar</button>
          </div>
        </div>
      </section>
      <section className="comparison" aria-label={SHOW_KMEANS ? 'Comparación de modelos' : 'Resultado de la red convolucional'}>
        <div className={`model-grid${SHOW_KMEANS ? '' : ' single-model'}`}>
          <ModelColumn kind="cnn" result={cnn} metrics={models?.metrics.value ?? null} loading={!models} busy={cnnBusy} unavailable={!!models && !models.cnn.value} />
          {SHOW_KMEANS && <ModelColumn kind="kmeans" result={kmeans} metrics={models?.metrics.value ?? null} loading={!models} busy={kmBusy} unavailable={!!models && !models.kmeans.value} />}
        </div>
        {SHOW_KMEANS && <div className={`agreement ${agreement === null ? '' : agreement ? 'matches' : 'differs'}`} role="status" aria-live="polite">
          <h2>Acuerdo entre modelos</h2><p>{agreementText}</p>
        </div>}
        {!models ? <p className="resource-note" role="status">{SHOW_KMEANS ? 'Cargando modelos…' : 'Cargando modelo…'}</p> : missing || !models.metrics.value ?
          <p className="resource-note">{missing ? (SHOW_KMEANS ? 'Los modelos aún no están disponibles.' : 'El modelo aún no está disponible.') : 'Las métricas aún no están disponibles.'} Coloca la exportación de Colab en <code>public/models/</code> y recarga la página.</p> : null}
      </section>
    </main>
  </>;
}
