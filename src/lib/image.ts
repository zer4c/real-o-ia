export type PreparedImage = { rgb: Float32Array; preview: string; width: number; height: number };
/** Sample cell centers, composite transparency on white, and never crop. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
    throw new Error('Selecciona una imagen JPG, PNG o WebP.');
  }
  if (file.size > 15 * 1024 * 1024) throw new Error('La imagen supera 15 MB. Elige un archivo más pequeño.');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('No se pudo abrir la imagen. Prueba con otro JPG, PNG o WebP.'); }
  try {
    const { width, height } = bitmap;
    if (width * height > 40_000_000) throw new Error('La imagen supera 40 megapíxeles. Reduce su tamaño y vuelve a subirla.');
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('El navegador no permite procesar esta imagen.');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,width,height); ctx.drawImage(bitmap,0,0);
    const pixels = ctx.getImageData(0,0,width,height).data;
    const small = document.createElement('canvas'); small.width = 32; small.height = 32;
    const smallCtx = small.getContext('2d');
    if (!smallCtx) throw new Error('No se pudo crear la vista de 32 × 32.');
    const image = smallCtx.createImageData(32,32);
    const rgb = new Float32Array(3072);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const sy = Math.min(Math.floor((y+0.5)*height/32), height-1);
      const sx = Math.min(Math.floor((x+0.5)*width/32), width-1);
      const src = (sy*width+sx)*4, dst = (y*32+x)*4;
      for (let c = 0; c < 3; c++) {
        image.data[dst+c] = pixels[src+c];
        rgb[(y*32+x)*3+c] = pixels[src+c]/255;
      }
      image.data[dst+3] = 255;
    }
    smallCtx.putImageData(image,0,0);
    return { rgb, preview: small.toDataURL('image/png'), width, height };
  } finally { bitmap.close(); }
}
