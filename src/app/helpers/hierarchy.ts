import * as _ from 'lodash';

import { Item, ItemFrame, Element } from '../index';
import { findInFrames } from './frames';

export function getElementsInHierarchyOrder(item: Item) {
  let hierarchy = (findInFrames(item, 'metadata.elementHierarchy') ||
    []) as string[];

  return _.sortBy(collectElementsToSort(item), el =>
    hierarchy.indexOf(el.id) >= 0 ? hierarchy.indexOf(el.id) : Number.MAX_VALUE
  );
}

function collectElementsToSort(item: Item): Element[] {
  let elements: Element[] = [];
  _.forEachRight(item.frames, (frame: ItemFrame) => {
    for (let element of frame.elements || []) {
      if (isSortableElement(element, frame)) {
        elements.push(element);
      }
    }
  });
  return elements;
}

function isSortableElement(element: Element, frame: ItemFrame) {
  if (element.type === 'foreground_image' || element.type === 'text') {
    return true; // Always sortable
  } else if (element.type === 'background_image') {
    return frame.metadata && !_.isEmpty(frame.metadata.objects); // Background sortable when object selected
  } else {
    return false;
  }
}
