import { BiDirectionalMap } from 'bi-directional-map/dist';
import * as _ from 'lodash';

import { TRANSFORMS } from './transforms/index';
import { collectBitmaps, restoreBitmaps } from './transform-bitmaps';
import WebpackWorker from 'worker-loader!*';
import { Item } from './index';

const ctx: WebpackWorker = self as any;

// Establish global "window" context, mostly as opentype.js thinks it's in Node
// otherwise and tries to load fonts using file system.
ctx.window = self;

let trackedBitmaps = new BiDirectionalMap();

function collectTransferableLayers(item: Item) {
  let transferables = [];
  for (let frame of item.frames || []) {
    if (frame.layer) {
      transferables.push(frame.layer);
    }
  }
  return transferables;
}

function getTransferables(newItem: Item, previousItem: Item) {
  let newTransferables = collectTransferableLayers(newItem);
  let previousTransferables = collectTransferableLayers(previousItem);
  return _.difference(newTransferables, previousTransferables);
}

onmessage = e => {
  let { actionId, taskId, transform, item, bitmaps, paramValues } = e.data;
  let itemWithBitmaps = restoreBitmaps(item, bitmaps, trackedBitmaps);
  let transformObject = <any>_.find(TRANSFORMS, { name: transform });
  transformObject.fn(itemWithBitmaps, paramValues, (newItem: Item) => {
    let bitmaps = collectBitmaps(newItem, trackedBitmaps);
    let transferables = getTransferables(newItem, itemWithBitmaps);
    postMessage({ actionId, taskId, ...bitmaps }, <any>transferables);
  });
};
