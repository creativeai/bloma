import * as _ from 'lodash';

import { findInFrames, findElement } from './frames';
import {
  SizeFormat,
  Pixels,
  Item,
  BackgroundImageElement,
  ImageSize
} from '../index';
import { buildCanvas } from './canvas';

function getScale(
  { renderWidth, renderHeight }: SizeFormat,
  maxWidth: Pixels,
  maxHeight: Pixels
) {
  let scale = 1;
  if (maxWidth && renderWidth > maxWidth) {
    scale = Math.min(scale, maxWidth / renderWidth);
  }
  if (maxHeight && renderHeight > maxHeight) {
    scale = Math.min(scale, maxHeight / renderHeight);
  }
  return scale;
}

export function renderFlatToCanvas(
  item: Item,
  layers: string[] = [],
  scaleDown = true,
  maxWidth: number = null,
  maxHeight: number = null
) {
  let size: SizeFormat = findInFrames(item, 'metadata.size');
  let scale = scaleDown ? getScale(size, maxWidth, maxHeight) : 1;

  let cnvs = document.createElement('canvas');
  let ctx = cnvs.getContext('2d');
  cnvs.width = size.renderWidth * scale;
  cnvs.height = size.renderHeight * scale;

  for (let i = 0; i < item.frames.length; i++) {
    if (item.frames[i].layer && _.includes(layers, item.frames[i].name)) {
      ctx.drawImage(
        item.frames[i].layer,
        0,
        0,
        size.renderWidth,
        size.renderHeight,
        0,
        0,
        size.renderWidth * scale,
        size.renderHeight * scale
      );
    }
  }
  return cnvs;
}

export function renderFlat(
  item: Item,
  layers: string[] = [],
  maxWidth: number = null,
  maxHeight: number = null
) {
  return renderFlatToCanvas(item, layers, true, maxWidth, maxHeight).toDataURL(
    'image/jpeg',
    1
  );
}

export function getAspectRatio(item: Item) {
  let finalSize = <SizeFormat>findInFrames(item, 'metadata.size');
  if (finalSize) {
    return finalSize.width / finalSize.height;
  } else {
    let bgElement = <BackgroundImageElement>(
      findElement(item, 'background_image')
    );
    return bgElement.originalSize.width / bgElement.originalSize.height;
  }
}

export function getAspectRatioClass(item: Item) {
  let ar = Math.round(getAspectRatio(item) * 10000) / 10000;
  if (ar <= 9 / 16) {
    return 'super-portrait';
  } else if (ar < 1) {
    return 'portrait';
  } else if (ar === 1) {
    return 'square';
  } else if (ar < 16 / 9) {
    return 'landscape';
  } else {
    return 'super-landscape';
  }
}

export function getBackgroundImage(item: Item) {
  return <BackgroundImageElement>findElement(item, 'background_image');
}

export function imageToForm(
  image: HTMLCanvasElement | HTMLImageElement | ImageBitmap,
  size: ImageSize
): Promise<FormData> {
  return new Promise(res => {
    let canvas = buildCanvas(size.width, size.height);
    canvas.getContext('2d').drawImage(image, 0, 0);
    let formData = new FormData();
    formData.append('type', 'ee');
    if (canvas.toBlob) {
      canvas.toBlob((blob: Blob) => {
        formData.append('image', blob, 'image.jpg');
        res(formData);
      }, 'image/jpeg');
    } else {
      // Chrome's weird nonstandard method for OffscreenCanvas
      (<any>canvas).convertToBlob({ type: 'image/jpeg' }).then((blob: Blob) => {
        formData.append('image', blob, 'image.jpg');
        res(formData);
      });
    }
  });
}

export function imgToCanvas(
  {
    image,
    originalSize
  }: {
    image: HTMLImageElement | HTMLCanvasElement | ImageBitmap;
    originalSize: ImageSize;
  },
  canvasSize: ImageSize = originalSize
) {
  let canvas = buildCanvas(canvasSize.width, canvasSize.height);
  canvas
    .getContext('2d')
    .drawImage(
      image,
      0,
      0,
      originalSize.width,
      originalSize.height,
      0,
      0,
      canvasSize.width,
      canvasSize.height
    );
  return canvas;
}

const imageCache = new Map<string, Promise<ImageBitmap | HTMLImageElement>>();
export function loadImage(
  url: string
): Promise<ImageBitmap | HTMLImageElement> {
  if (imageCache.has(url)) {
    return imageCache.get(url);
  } else {
    let res: Promise<ImageBitmap | HTMLImageElement>;
    if ('createImageBitmap' in window) {
      res = fetch(url, { mode: 'cors' })
        .then(res => res.blob())
        .then(blob => createImageBitmap(blob));
    } else {
      res = loadImageDOM(url);
    }
    imageCache.set(url, res);
    return res;
  }
}

export function loadImageDOM(url: string): Promise<HTMLImageElement> {
  let img = document.createElement('img');
  img.crossOrigin = 'Anonymous';
  img.src = url;
  return new Promise(
    res =>
      (img.onload = () => {
        res(img);
      })
  );
}

export function resizeImage(
  img: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  width?: number,
  height?: number
) {
  let aspectRatio = img.width / img.height;
  if (_.isNumber(width) && !_.isNumber(height)) {
    height = width / aspectRatio;
  } else if (_.isNumber(height) && !_.isNumber(width)) {
    width = height * aspectRatio;
  }

  if (img.width <= width && img.height <= height) {
    return { image: img, size: { width: img.width, height: img.height } };
  }

  let targetCanvas = document.createElement('canvas');
  targetCanvas.width = width;
  targetCanvas.height = height;
  let ctx = targetCanvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return { image: targetCanvas, size: { width, height } };
}

export function imageToBitmapOrCanvas(
  img: HTMLImageElement | HTMLCanvasElement
): Promise<ImageBitmap | HTMLCanvasElement> {
  if ('createImageBitmap' in window) {
    return tryCreateImageBitmap(img);
  } else if (img.tagName === 'CANVAS') {
    return Promise.resolve(<HTMLCanvasElement>img);
  } else {
    let canvas = buildCanvas(img.width, img.height);
    canvas.getContext('2d').drawImage(img, 0, 0);
    return Promise.resolve(canvas);
  }
}

function tryCreateImageBitmap(img: HTMLImageElement | HTMLCanvasElement) {
  if (lookslikeVectorImage(img)) {
    // rasterize first
    img = imgToCanvas({
      image: img,
      originalSize: { width: img.width, height: img.height }
    });
  }
  return createImageBitmap(img).catch(err => {
    // Might have been a vector anyway (without file extension), try rasterizing once more
    img = imgToCanvas({
      image: img,
      originalSize: { width: img.width, height: img.height }
    });
    return createImageBitmap(img);
  });
}

function lookslikeVectorImage(img: HTMLImageElement | HTMLCanvasElement) {
  if (img.tagName === 'CANVAS') {
    return false;
  } else {
    let theImg = img as HTMLImageElement;
    return theImg.src && theImg.src.toLowerCase().endsWith('svg');
  }
}
