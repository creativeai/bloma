export function buildCanvas(width: number, height: number) {
  if (window.document) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  } else {
    return new OffscreenCanvas(width, height);
  }
}

export function canvasFromBitmap(bitmap: ImageBitmap) {
  let canvas = buildCanvas(bitmap.width, bitmap.height);
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  return canvas;
}
