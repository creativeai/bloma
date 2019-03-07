import { BiDirectionalMap } from 'bi-directional-map/dist';
import * as _ from 'lodash';

import TransformWorker from 'worker-loader!./transform-worker';
import {
  collectBitmaps,
  restoreBitmaps,
  BitmapTransformItem
} from './transform-bitmaps';
import { ActionItem, Item, ActionCallback, Element } from './index';

// We only do background work when Web Workers, the OffscreenCanvas, and image bitmaps are all supported
let workerEnabled =
  'Worker' in window &&
  'OffscreenCanvas' in window &&
  'createImageBitmap' in window;

let transformWorker: TransformWorker,
  pendingCallbacks: Map<string, Map<string, ActionCallback>>,
  trackedBitmaps: any;

function dropOriginalImages(item: Item): Item {
  return {
    ...item,
    frames: (item.frames || []).map(frame => ({
      ...frame,
      elements: (frame.elements || []).map(
        element => _.omit(element, 'originalImage') as Element
      )
    }))
  };
}

function prepareItemForWorker(item: ActionItem) {
  if (item === 'endOfBatch') {
    return { item, bitmaps: [] as BitmapTransformItem[] };
  } else {
    return collectBitmaps(dropOriginalImages(item), trackedBitmaps);
  }
}

export function initTransformWorker() {
  if (workerEnabled) {
    transformWorker = new TransformWorker();
    pendingCallbacks = new Map();
    trackedBitmaps = new BiDirectionalMap();
    transformWorker.onmessage = event => {
      let { actionId, taskId, item, bitmaps } = event.data;
      let itemWithBitmaps = restoreBitmaps(item, bitmaps, trackedBitmaps);
      let actionCallbackMap = pendingCallbacks.get(actionId);
      let callback = actionCallbackMap.get(taskId);
      callback(itemWithBitmaps);
      if (item === 'endOfBatch') {
        actionCallbackMap.clear();
      }
    };
  }
}

export function destroyTransformWorker() {
  if (workerEnabled) {
    transformWorker.terminate();
    transformWorker = null;
    pendingCallbacks = new Map();
    trackedBitmaps = new BiDirectionalMap();
  }
}

export function runTransform(
  action: any,
  item: ActionItem,
  paramValues: any,
  callback: ActionCallback
) {
  if (action.transform.runInWorker && workerEnabled) {
    let taskId = _.uniqueId();
    let message = {
      actionId: action.id,
      taskId,
      transform: action.transform.name,
      paramValues,
      ...prepareItemForWorker(item)
    };
    transformWorker.postMessage(message);

    let actionCallbackMap = pendingCallbacks.get(action.id);
    if (!actionCallbackMap) {
      actionCallbackMap = new Map();
      pendingCallbacks.set(action.id, actionCallbackMap);
    }
    actionCallbackMap.set(taskId, callback);
  } else {
    action.transform.fn(item, paramValues, callback);
  }
}
