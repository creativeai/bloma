import * as update from 'immutability-helper';
import * as _ from 'lodash';
import { Item } from './index';

export interface BitmapTransformItem {
  frameIdx: number;
  elementIdx: number;
  bitmapId: string;
  bitmap?: ImageBitmap | HTMLCanvasElement | HTMLImageElement;
}

export function collectBitmaps(item: Item, trackedBitmaps: any) {
  let bitmaps: BitmapTransformItem[] = [];
  let preparedItem = {
    ...item,
    frames: (item.frames || []).map((frame, frameIdx) => ({
      ...frame,
      elements: (frame.elements || []).map((element, elementIdx) => {
        if (
          element.type === 'background_image' ||
          element.type === 'foreground_image'
        ) {
          if (trackedBitmaps.hasValue(element.image)) {
            bitmaps.push({
              frameIdx,
              elementIdx,
              bitmapId: trackedBitmaps.getKey(element.image)
            });
          } else {
            let bitmapId = _.uniqueId();
            trackedBitmaps.set(bitmapId, element.image);
            bitmaps.push({
              frameIdx,
              elementIdx,
              bitmapId: bitmapId,
              bitmap: element.image
            });
          }
          return { ...element, image: null };
        } else {
          return element;
        }
      })
    }))
  };
  return { item: preparedItem, bitmaps };
}

export function restoreBitmaps(
  item: Item,
  bitmaps: BitmapTransformItem[],
  trackedBitmaps: any
) {
  for (let { frameIdx, elementIdx, bitmapId, bitmap } of bitmaps) {
    if (bitmap) {
      trackedBitmaps.set(bitmapId, bitmap);
    } else {
      bitmap = trackedBitmaps.getValue(bitmapId);
    }
    item = update(item, {
      frames: {
        [frameIdx]: { elements: { [elementIdx]: { image: { $set: bitmap } } } }
      }
    });
  }
  return item;
}
