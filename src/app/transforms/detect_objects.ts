import yolo, { downloadModel } from 'tfjs-yolo-tiny';
import * as tf from '@tensorflow/tfjs';
import * as _ from 'lodash';

import { makeSerialExecutor } from '../helpers/async';
import { findElement } from '../helpers/frames';
import {
  ActionItem,
  DetectObjectsSettings,
  BackgroundImageElement,
  DetectedObject,
  Pixels
} from '../index';

const ANALYZED_WIDTH = 416;
const ANALYZED_HEIGHT = 416;
const DEFAULT_IMPORTANCE = 0.5;
const RESIZE_THRESHOLD = ANALYZED_WIDTH * 5;
const PATCHWORK_DOWNSCALE = ANALYZED_WIDTH * 3;
const PATCHWORK_STEP = (ANALYZED_WIDTH * 3) / 4;

let modelPromise: Promise<any>;
function loadModel() {
  if (!modelPromise) {
    modelPromise = downloadModel('models/yolo_tiny_tfjs/model2.json');
  }
  return modelPromise;
}

function getResizeMetrics(
  img: HTMLImageElement | HTMLCanvasElement | ImageBitmap
) {
  let widthRatio = ANALYZED_WIDTH / img.width;
  let heightRatio = ANALYZED_HEIGHT / img.height;
  let ratio = Math.min(widthRatio, heightRatio);
  let resizedWidth = img.width * ratio;
  let resizedHeight = img.height * ratio;
  let resizedX = (ANALYZED_WIDTH - resizedWidth) / 2;
  let resizedY = (ANALYZED_HEIGHT - resizedHeight) / 2;
  return { ratio, resizedWidth, resizedHeight, resizedX, resizedY };
}

function resizeImage(
  img: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  width = ANALYZED_WIDTH,
  height = ANALYZED_HEIGHT
) {
  let targetCanvas = document.createElement('canvas');
  targetCanvas.width = width;
  targetCanvas.height = height;
  let ctx = targetCanvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  let { resizedWidth, resizedHeight, resizedX, resizedY } = getResizeMetrics(
    img
  );
  ctx.drawImage(img, resizedX, resizedY, resizedWidth, resizedHeight);

  return targetCanvas;
}

function clamp(value: number, a: number, b: number) {
  return Math.max(a, Math.min(b, value));
}

function translateBoxToOriginalSize(
  box: DetectedObject,
  originalImage: HTMLImageElement | HTMLCanvasElement | ImageBitmap
): DetectedObject {
  let { ratio, resizedX, resizedY } = getResizeMetrics(originalImage);
  return {
    ...box,
    left: clamp((box.left - resizedX) / ratio, 0, originalImage.width),
    top: clamp((box.top - resizedY) / ratio, 0, originalImage.height),
    bottom: clamp((box.bottom - resizedY) / ratio, 0, originalImage.height),
    right: clamp((box.right - resizedX) / ratio, 0, originalImage.width)
  };
}

function attachImportance(
  box: DetectedObject,
  settings: DetectObjectsSettings
): DetectedObject {
  let value = settings[box.className.toLowerCase()];
  if (value) {
    return { ...box, importance: value };
  } else {
    return { ...box, importance: DEFAULT_IMPORTANCE };
  }
}

function attachFocalPoint(box: DetectedObject) {
  return {
    ...box,
    focalPoint: [
      box.left + (box.right - box.left) / 2,
      box.top + (box.bottom - box.top) / 2
    ]
  };
}

function translatePatchBoxes(
  boxes: DetectedObject[],
  patchX: Pixels,
  patchY: Pixels,
  resizeScale: number
): DetectedObject[] {
  return boxes.map(box => ({
    ...box,
    left: (box.left + patchX) / resizeScale,
    right: (box.right + patchX) / resizeScale,
    top: (box.top + patchY) / resizeScale,
    bottom: (box.bottom + patchY) / resizeScale
  }));
}

function runDetection(
  model: any,
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap
): Promise<DetectedObject[]> {
  if (image.width <= RESIZE_THRESHOLD && image.height <= RESIZE_THRESHOLD) {
    let resized = resizeImage(image);
    return yolo(
      tf
        .fromPixels(resized)
        .expandDims(0)
        .toFloat()
        .div(tf.scalar(255)),
      model
    ).then((boxes: DetectedObject[]) =>
      boxes.map(box => translateBoxToOriginalSize(box, image))
    );
  } else {
    let biggerSize = Math.max(image.width, image.height);
    let scale = PATCHWORK_DOWNSCALE / biggerSize;
    let resizedToThreshold = document.createElement('canvas');
    resizedToThreshold.width = image.width * scale;
    resizedToThreshold.height = image.height * scale;
    resizedToThreshold
      .getContext('2d')
      .drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        resizedToThreshold.width,
        resizedToThreshold.height
      );

    let x = 0,
      y = 0,
      resultPromise = Promise.resolve([]);
    while (x < resizedToThreshold.width) {
      y = 0;
      while (y < resizedToThreshold.height) {
        let patchX = x;
        let patchY = y;
        let patch = document.createElement('canvas');
        patch.width = ANALYZED_WIDTH;
        patch.height = ANALYZED_HEIGHT;
        patch
          .getContext('2d')
          .drawImage(
            resizedToThreshold,
            patchX,
            patchY,
            ANALYZED_WIDTH,
            ANALYZED_HEIGHT,
            0,
            0,
            ANALYZED_WIDTH,
            ANALYZED_HEIGHT
          );
        resultPromise = resultPromise.then(boxes =>
          yolo(
            tf
              .fromPixels(patch)
              .expandDims(0)
              .toFloat()
              .div(tf.scalar(255)),
            model
          )
            .then((r: DetectedObject[]) =>
              translatePatchBoxes(r, patchX, patchY, scale)
            )
            .then((r: DetectedObject[]) => boxes.concat(r))
        );

        y += PATCHWORK_STEP;
      }
      x += PATCHWORK_STEP;
    }

    return resultPromise;
  }
}

let pending: Promise<any>[] = [];
let executor = makeSerialExecutor();
export function detectObjects(
  item: ActionItem,
  settings: DetectObjectsSettings,
  next: (item: ActionItem) => any
) {
  if (item === 'endOfBatch') {
    Promise.all(pending).then(() => next('endOfBatch'));
    pending = [];
  } else {
    let image = <BackgroundImageElement>findElement(item, 'background_image');
    pending.push(
      executor(() => {
        return loadModel()
          .then(model => runDetection(model, image.image))
          .then(boxes => boxes.map(box => attachImportance(box, settings)))
          .then(boxes => boxes.map(box => attachFocalPoint(box)))
          .then((boxes: DetectedObject[]) => {
            if (_.isEmpty(boxes)) {
              next({
                ...item,
                frames: [
                  ...item.frames,
                  {
                    name: 'Objects',
                    fromActionId: settings.actionId,
                    metadata: {
                      allObjects: []
                    }
                  }
                ]
              });
            } else {
              next({
                ...item,
                frames: [
                  ...item.frames,
                  {
                    name: 'Objects',
                    fromActionId: settings.actionId,
                    metadata: {
                      allObjects: boxes
                    }
                  }
                ]
              });
            }
          });
      })
    );
  }
}
