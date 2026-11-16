# Modelos CIFAKE

Exportación entrenada proporcionada por el usuario e instalada desde `real-o-ia-models.zip`.

- `cnn/model.json` y `cnn/group1-shard1of1.bin`: CNN de TensorFlow.js.
- `kmeans.json`: características v1, escalador, centroides y asociación de grupos.
- `metrics.json`: métricas reales de Colab y registro de limpieza.
- `parity.json`: caso de referencia para `pnpm verify:models`.

Para actualizar, extraer la nueva exportación del notebook en esta carpeta y recargar la aplicación. No hace falta volver a entrenar para ejecutar el frontend.
