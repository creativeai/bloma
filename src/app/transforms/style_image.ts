import * as _ from 'lodash';
import parseColor from 'parse-color';

import {
  imgToCanvas,
  imageToBitmapOrCanvas,
  loadImage
} from '../helpers/images';
import {
  findElement,
  getStyles,
  getBackgroundColorStyles
} from '../helpers/frames';
import { makeSerialExecutor } from '../helpers/async';
import { buildCanvas } from '../helpers/canvas';
import {
  Item,
  BackgroundImageElement,
  ActionItem,
  StyleImageActionSettings,
  GradientMapStyle,
  AddNoiseStyle,
  SaturateStyle,
  Styles,
  ForegroundImageElement,
  ImageSize,
  ItemFrame,
  ImageBlendStyle,
  ColorBlendStyle
} from '../index';
import { DEFAULT_FILTER_STYLE } from '../styles';

function getNChannels(imageData: ImageData) {
  let nPixels = imageData.width * imageData.height;
  let nChannels = imageData.data.length / nPixels;
  return nChannels;
}

function calculateGradientMap(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  nChannels: number,
  style: GradientMapStyle
): Uint8ClampedArray {
  let color1 = parseColor(style.from);
  let color2 = parseColor(style.to);
  if (!color1 || !color2 || !color1.rgba || !color2.rgba) {
    return data;
  }
  let gradientArray = [];
  for (let d = 0; d < 255; d += 1) {
    let ratio = d / 255;
    let l = ratio;
    let rA = Math.floor(color1.rgba[0] * (1 - l) + color2.rgba[0] * l);
    let gA = Math.floor(color1.rgba[1] * (1 - l) + color2.rgba[1] * l);
    let bA = Math.floor(color1.rgba[2] * (1 - l) + color2.rgba[2] * l);
    let aA = Math.floor(255 * (color1.rgba[3] * (1 - l) + color2.rgba[3] * l));
    gradientArray.push([rA, gA, bA, aA]);
  }

  let result = new Uint8ClampedArray(data.length);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let offset = (y * width + x) * nChannels;

      // Greyscale using weighted average of r, g, b
      let r = data[offset],
        g = data[offset + 1],
        b = data[offset + 2];
      let avg = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);

      // Convert to HSL
      let [h, s, l] = rgbToHsl(avg, avg, avg);
      // Luminance in 0..254
      let luminance = Math.floor(l * 254);

      // Pick gradient color based on luminance
      let [finalR, finalG, finalB, finalA] = gradientArray[luminance];
      if (finalA < 255) {
        let baseAlpha = 1 - finalA / 255;
        result[offset] = r * baseAlpha;
        result[offset + 1] = g * baseAlpha;
        result[offset + 2] = b * baseAlpha;
      }
      let overlayAlpha = finalA / 255;
      result[offset] += finalR * overlayAlpha;
      result[offset + 1] += finalG * overlayAlpha;
      result[offset + 2] += finalB * overlayAlpha;
      result[offset + 3] = 255;
    }
  }
  return result;
}

function calculateNoise(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  nChannels: number,
  style: AddNoiseStyle
): Uint8ClampedArray {
  let amount = style.amount;
  if (!amount) {
    return data;
  }

  let result = new Uint8ClampedArray(data.length);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let offset = (y * width + x) * nChannels;

      // Add randomness
      let rand = (Math.random() * 5.1 - 2.55) * amount;
      let r = data[offset] + rand,
        g = data[offset + 1] + rand,
        b = data[offset + 2] + rand;

      result[offset] = r;
      result[offset + 1] = g;
      result[offset + 2] = b;
      if (nChannels > 3) {
        // preserve alpha
        result[offset + 3] = data[offset + 3];
      }
    }
  }
  return result;
}

function calculateSaturation(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  nChannels: number,
  style: SaturateStyle
): Uint8ClampedArray {
  let amount = style.amount;
  if (amount === 0 || isNaN(amount)) {
    return data;
  }

  let adjust = amount * -0.01;

  let result = new Uint8ClampedArray(data.length);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let offset = (y * width + x) * nChannels;
      let r = data[offset],
        g = data[offset + 1],
        b = data[offset + 2],
        max = Math.max(r, g, b);

      result[offset] = r === max ? r : r + (max - r) * adjust;
      result[offset + 1] = g === max ? g : g + (max - g) * adjust;
      result[offset + 2] = b === max ? b : b + (max - b) * adjust;
      if (nChannels > 3) {
        // preserve alpha
        result[offset + 3] = data[offset + 3];
      }
    }
  }
  return result;
}

function addImageBlend(image: HTMLCanvasElement, style: ImageBlendStyle) {
  return loadImage(style.blendImageUrl).then(blendImg => {
    let ctx = image.getContext('2d');
    let prevCompositeOp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = style.compositeOperation;
    let fillAspectRatio = blendImg.width / blendImg.height,
      fillWidth = image.width,
      fillHeight = fillWidth / fillAspectRatio;
    if (fillHeight < image.height) {
      fillHeight = image.height;
      fillWidth = fillHeight * fillAspectRatio;
    }
    let fillWidthDiff = fillWidth - image.width,
      fillHeightDiff = fillHeight - image.height;

    ctx.drawImage(
      blendImg,
      0,
      0,
      blendImg.width,
      blendImg.height,
      style.anchor === 'center' ? -fillWidthDiff / 2 : 0,
      style.anchor === 'center' ? -fillHeightDiff / 2 : 0,
      fillWidth,
      fillHeight
    );
    ctx.globalCompositeOperation = prevCompositeOp;
    return image;
  });
}

function addColorBlend(image: HTMLCanvasElement, style: ColorBlendStyle) {
  let ctx = image.getContext('2d');
  let prevCompositeOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = style.compositeOperation;
  ctx.fillStyle = style.color;
  ctx.fillRect(0, 0, image.width, image.height);
  ctx.globalCompositeOperation = prevCompositeOp;
  return image;
}

export function doStyleImage(
  sourceImage: BackgroundImageElement | ForegroundImageElement,
  styles: Styles,
  renderSize: ImageSize = sourceImage.originalSize
): Promise<HTMLCanvasElement> {
  let sourceCanvas = imgToCanvas(sourceImage, renderSize);
  let imageData = sourceCanvas
    .getContext('2d')
    .getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

  let result = imageData.data,
    width = imageData.width,
    height = imageData.height,
    nChannels = getNChannels(imageData);

  if (styles.gradientMap) {
    result = calculateGradientMap(
      result,
      width,
      height,
      nChannels,
      styles.gradientMap
    );
  }

  if (styles.addNoise) {
    result = calculateNoise(result, width, height, nChannels, styles.addNoise);
  }

  if (styles.saturate) {
    result = calculateSaturation(
      result,
      width,
      height,
      nChannels,
      styles.saturate
    );
  }

  let resultData = new ImageData(result, imageData.width, imageData.height);
  let resultCanvas = buildCanvas(imageData.width, imageData.height);
  resultCanvas.getContext('2d').putImageData(resultData, 0, 0);

  if (styles.colorBlend) {
    addColorBlend(resultCanvas, styles.colorBlend);
  }
  if (styles.imageBlend) {
    return addImageBlend(resultCanvas, styles.imageBlend).then(
      () => resultCanvas
    );
  } else {
    return Promise.resolve(resultCanvas);
  }
}

let pending: Promise<any>[] = [];
let executor = makeSerialExecutor();
export function styleImage(
  item: ActionItem,
  settings: StyleImageActionSettings,
  next: (item: ActionItem) => any
) {
  if (item === 'endOfBatch') {
    Promise.all(pending).then(() => next(item));
    pending = [];
  } else {
    pending.push(
      executor(() => {
        let sourceImage = <BackgroundImageElement>(
          findElement(item, 'background_image')
        );
        let styles = getBackgroundColorStyles(item);
        if (_.isEmpty(styles)) {
          styles = [DEFAULT_FILTER_STYLE];
        }
        if (!sourceImage) {
          next(item);
          return Promise.resolve(true);
        }
        return Promise.all(
          styles.map(style =>
            doStyleImage(sourceImage, style)
              .then(imageToBitmapOrCanvas)
              .then(bitMap => ({
                name: 'Style Image',
                fromActionId: settings.actionId,
                metadata: {},
                elements: [
                  {
                    ...sourceImage,
                    image: bitMap,
                    appliedStyles: [style]
                  }
                ]
              }))
          )
        ).then((newFrames: ItemFrame[]) => {
          next({ ...item, frames: [...item.frames, ...newFrames] });
        });
      })
    );
  }
}

function rgbToHsl(r: number, g: number, b: number) {
  (r /= 255), (g /= 255), (b /= 255);

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h, s, l];
}
