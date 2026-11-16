# Real o IA

Prototipo académico para comparar una CNN entrenada desde cero y k-means independiente sobre CIFAKE. La inferencia ocurre en el navegador; no requiere backend ni sube imágenes a un servidor.

## Ejecutar

Requiere Node.js 22.18 o superior y pnpm. Usar **pnpm exclusivamente**.

```sh
pnpm install
pnpm dev
```

Abre la URL local que imprime Vite. La pantalla inicia en modo oscuro, permite cambiar al modo claro y recuerda la elección. Primero aparece la carga de imagen y la entrada de 32 × 32; al desplazarte aparecen las dos comparaciones y el acuerdo entre modelos. En móviles, las columnas se apilan.

Sube o arrastra una sola imagen JPG, PNG o WebP (hasta 15 MB y 40 megapíxeles). El análisis comienza automáticamente. `Limpiar` descarta la imagen y sus resultados; las métricas generales del test permanecen.

## Modelos incluidos

La exportación proporcionada por el usuario se extrajo de `real-o-ia-models.zip` a `public/models/`. El ZIP original se conserva y no es necesario para servir la aplicación.

| Archivo | Contenido |
| --- | --- |
| `public/models/cnn/model.json` y `.bin` | Arquitectura y pesos de la CNN para TensorFlow.js |
| `public/models/kmeans.json` | Escalador, centroides y asociación de grupos con clases |
| `public/models/metrics.json` | Métricas y protocolo registrados en Colab |
| `public/models/parity.json` | Entrada de referencia para comprobar paridad Python/JavaScript |

Para reemplazarlos, ejecuta [el notebook](notebooks/real_o_ia.ipynb) en Colab y extrae su ZIP en la misma carpeta. No renombres ni separes los shards de la CNN. Recarga la aplicación después. Si faltan archivos, se muestran estados pendientes; no se inventan predicciones.

## Comprobar y compilar

```sh
pnpm test
pnpm verify:models
pnpm build
pnpm preview
```

`verify:models` carga los pesos reales con TensorFlow.js en CPU, compara el puntaje de la CNN y las distancias/características de k-means con el caso exportado de Colab y comprueba la liberación de tensores. No entrena modelos ni descarga CIFAKE. `build` comprueba TypeScript y genera `dist/` para hosting estático. Servir por HTTP(S); abrir `index.html` directamente con `file://` no permite cargar los módulos y modelos correctamente.

Se verificaron la compilación, las pruebas de características y la paridad numérica. La revisión visual y las interacciones en un navegador no pudieron verificarse desde el entorno del asistente: la creación de sockets y la apertura del servidor local están bloqueadas.

## Interpretar los resultados

Accuracy y F1 son métricas del **test**, no de la imagen subida. F1 se calcula para FAKE. El puntaje FAKE de la CNN usa umbral 0.5 y no es una probabilidad calibrada. La distancia de k-means es euclídea al centroide asignado, después de escalar las 35 características manuales. Las etiquetas REAL/FAKE de los grupos se asociaron después del ajuste usando únicamente entrenamiento. La coincidencia entre modelos no demuestra autenticidad.

La exportación recibida registra 78 961 imágenes de entrenamiento, 19 741 de validación y 20 000 de test. Accuracy: CNN **95,84 %**, k-means **52,685 %**. Son resultados de esa ejecución; k-means apenas supera el 50 % en este conjunto balanceado. No se promete detección general de generadores actuales: CIFAKE compara CIFAR-10 con imágenes de Stable Diffusion 1.4 a baja resolución.

El notebook conserva un representante por duplicado byte a byte del train oficial y excluye de entrenamiento archivos idénticos presentes en test, sin consultar etiquetas de test. Después realiza la partición estratificada train/validación. El test oficial permanece intacto. Los recuentos de limpieza están en `split_audit`; SHA-256 no detecta casi duplicados ni imágenes recodificadas.

## Estructura

- `src/App.tsx`: interfaz, temas, carga y estados de inferencia.
- `src/lib/image.ts`: decodificación RGB, transparencia sobre blanco y muestreo por vecino más próximo a 32 × 32.
- `src/lib/features.ts`: características y asignación al centroide independiente de la CNN.
- `src/lib/models.ts`: carga y validación de artefactos e inferencia TensorFlow.js.
- `scripts/verify-models.mjs`: comprobación reproducible de paridad.
- `notebooks/real_o_ia.ipynb`: entrenamiento, evaluación y exportación en Colab.

## Referencias

- Krizhevsky, A., & Hinton, G. (2009). *Learning multiple layers of features from tiny images*.
- Bird, J. J., & Lotfi, A. (2024). *CIFAKE: Image Classification and Explainable Identification of AI-Generated Synthetic Images*. IEEE Access.
- [Dataset CIFAKE](https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images).

Este repositorio no incluye el dataset. Las fuentes Newsreader y DM Sans se sirven localmente; sus licencias OFL están en `public/fonts/`.
