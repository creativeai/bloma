import * as _ from 'lodash';
import { Item, ItemFrame, ElementType, Element, Styles } from '../index';

export function findFrameWith(item: Item, ...keyPaths: string[]): ItemFrame {
  if (item) {
    return _.findLast(item.frames, f =>
      _.some(keyPaths, keyPath => _.has(f, keyPath))
    );
  }
  return null;
}

export function findInFrames<T>(item: Item, keyPath: string): T {
  let frame = findFrameWith(item, keyPath);
  if (frame) {
    return _.get(frame, keyPath);
  }
  return null;
}

export function findElement(item: Item, type: ElementType): Element {
  for (let i = item.frames.length - 1; i >= 0; i--) {
    for (let el of item.frames[i].elements || []) {
      if (el.type === type) {
        return el;
      }
    }
  }
  return null;
}

export function findAllElements(item: Item, type: ElementType): Element[] {
  let results: Element[] = [];
  for (let i = item.frames.length - 1; i >= 0; i--) {
    for (let el of item.frames[i].elements || []) {
      if (el.type === type) {
        results.push(el);
      }
    }
  }
  return results;
}

export function findElementById(item: Item, id: string): Element {
  for (let i = item.frames.length - 1; i >= 0; i--) {
    for (let el of item.frames[i].elements || []) {
      if (el.id === id) {
        return el;
      }
    }
  }
  return null;
}

export function getStyles(item: Item, type: ElementType): Styles[] {
  let styles = [];
  for (let frame of item.frames) {
    if (
      frame.metadata &&
      frame.metadata.style &&
      _.includes(frame.metadata.style.elementTypes, type)
    ) {
      styles.push(frame.metadata.style);
    }
  }
  return styles;
}

export function getCombinedStyles(item: Item, type: ElementType): Styles {
  let combinedStyles = {};
  for (let styles of getStyles(item, type)) {
    _.merge(combinedStyles, styles);
  }
  return combinedStyles as Styles;
}

export function getStylesWithProperty(
  item: Item,
  type: ElementType,
  withProperty: string = null
) {
  let styles: Styles[];
  if (item) {
    styles = getStyles(item, type);
  } else {
    styles = [];
  }
  return withProperty ? styles.filter(s => _.has(s, withProperty)) : styles;
}

export function getTextStyles(item: Item) {
  return getStylesWithProperty(item, 'text', 'text.h1.fontFamily');
}

export function getTextColorStyles(item: Item) {
  let colorStyles = _.uniq(
    getStylesWithProperty(item, 'text', 'text.h1.textColors').concat(
      getStylesWithProperty(item, 'text', 'text.h1.textMaskUrl')
    )
  );
  // Don't list styles that are also background styles here again
  colorStyles = _.difference(colorStyles, getBackgroundColorStyles(item));
  return colorStyles;
}

export function getBackgroundColorStyles(item: Item) {
  return getStylesWithProperty(item, 'background_image', undefined);
}
