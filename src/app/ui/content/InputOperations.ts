import * as update from 'immutability-helper';
import * as _ from 'lodash';

import {
  CSSColor,
  ItemFrame,
  DetectedObject,
  Styles,
  StyleBundle,
  TextHeadingLevel,
  TextElement,
  TextContent
} from '../../index';
import { InputPanelProps } from './InputPanel';
import { InputPaletteProps } from './InputPalette';
import { BackgroundImageContent } from './BackgroundImageSelector';
import { ForegroundContent } from './ForegroundSelector';
import { findFrameWith } from '../../helpers/frames';

export function addBackgroundColorFrame(
  color: CSSColor,
  props: InputPanelProps | InputPaletteProps
) {
  let newFrame: ItemFrame = {
    fromActionId: props.action.id,
    metadata: {},
    elements: [
      {
        id: _.uniqueId(),
        type: 'background_color',
        color
      }
    ]
  };
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frames = _.reject(item.frames, f =>
      _.some(
        f.elements,
        f => f.type === 'background_color' || f.type === 'background_image'
      )
    );
    props.onUpdateItem(
      i,
      update(item, { frames: { $set: frames.concat([newFrame]) } })
    );
  }
}

export function addBackgroundImageFrame(
  content: BackgroundImageContent,
  props: InputPaletteProps | InputPanelProps
) {
  let newFrame: ItemFrame = {
    fromActionId: props.action.id,
    metadata: {},
    name: 'Background Image',
    elements: [
      {
        id: _.uniqueId(),
        type: 'background_image',
        image: content.bitmap,
        originalSize: content.originalSize,
        fileName: content.fileName
      }
    ]
  };
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frames = _.reject(item.frames, f =>
      _.some(
        f.elements,
        f => f.type === 'background_color' || f.type === 'background_image'
      )
    );
    props.onUpdateItem(
      i,
      update(item, { frames: { $set: frames.concat([newFrame]) } })
    );
  }
}

export function updateObjectsInBackgroundImageFrame(
  objects: DetectedObject[],
  props: InputPaletteProps | InputPanelProps
) {
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frameIndex = _.findIndex(item.frames, f =>
      _.some(f.elements, { type: 'background_image' })
    );
    props.onUpdateItem(
      i,
      update(item, {
        frames: {
          [frameIndex]: { metadata: { allObjects: { $set: objects } } }
        }
      })
    );
  }
}

export function updateHighlightedObjectInBackgroundImageFrame(
  index: number,
  props: InputPanelProps | InputPaletteProps
) {
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frameIndex = _.findIndex(item.frames, f =>
      _.some(f.elements, { type: 'background_image' })
    );
    let highlightedObjects: DetectedObject[];
    if (_.isNumber(index)) {
      let allObjects = item.frames[frameIndex].metadata.allObjects;
      highlightedObjects = [allObjects[index]];
    } else {
      highlightedObjects = [];
    }
    props.onUpdateItem(
      i,
      update(item, {
        frames: {
          [frameIndex]: {
            metadata: { highlightedObjects: { $set: highlightedObjects } }
          }
        }
      })
    );
  }
}

export function updateSelectedObjectInBackgroundImageFrame(
  index: number,
  props: InputPanelProps | InputPaletteProps
) {
  let isSelected = false;
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frameIndex = _.findIndex(item.frames, f =>
      _.some(f.elements, { type: 'background_image' })
    );
    let selectedObjects: DetectedObject[];
    if (_.isNumber(index)) {
      let allObjects = item.frames[frameIndex].metadata.allObjects;
      selectedObjects = [allObjects[index]];
      isSelected = true;
    } else {
      selectedObjects = null;
      isSelected = false;
    }
    props.onUpdateItem(
      i,
      update(item, {
        frames: {
          [frameIndex]: { metadata: { objects: { $set: selectedObjects } } }
        }
      })
    );
  }
  return isSelected;
}

export function updateObjectInBackgroundImageFrame(
  index: number,
  updatedObject: DetectedObject,
  props: InputPaletteProps | InputPanelProps
) {
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frame = findFrameWith(item, 'metadata.allObjects');
    let frameIndex = item.frames.indexOf(frame);
    let alsoUpdateSelected =
      _.first(frame.metadata.objects) === frame.metadata.allObjects[index];

    props.onUpdateItem(
      i,
      update(item, {
        frames: {
          [frameIndex]: {
            metadata: alsoUpdateSelected
              ? {
                  allObjects: { [index]: { $set: updatedObject } },
                  objects: { [0]: { $set: updatedObject } }
                }
              : { allObjects: { [index]: { $set: updatedObject } } }
          }
        }
      })
    );
  }
}

export function addForegroundFrame(
  content: ForegroundContent,
  props: InputPanelProps | InputPaletteProps
) {
  let newFrame: ItemFrame = {
    fromActionId: props.action.id,
    metadata: {},
    elements: [
      {
        id: _.uniqueId(),
        type: 'foreground_image',
        image: content.bitmap,
        originalSize: content.originalSize,
        fileName: content.fileName
      }
    ]
  };
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frames = _.reject(
      item.frames,
      f => f.elements && _.find(f.elements, { type: 'foreground_image' })
    );
    props.onUpdateItem(
      i,
      update(item, { frames: { $set: frames.concat([newFrame]) } })
    );
  }
}

export function addStyleFrame(
  styles: Styles,
  props: InputPanelProps | InputPaletteProps
) {
  let newFrame: ItemFrame = {
    fromActionId: props.action.id,
    metadata: {
      style: styles
    }
  };
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frames = item.frames.filter(
      f => !_.isEqual(_.get(f, 'metadata.style'), styles)
    );
    props.onUpdateItem(
      i,
      update(item, { frames: { $set: frames.concat([newFrame]) } })
    );
  }
}

export function addStyleBundleFrames(
  bundle: StyleBundle,
  props: InputPanelProps | InputPaletteProps
) {
  let newFrames: ItemFrame[] = bundle.styles.map(styles => ({
    fromActionId: props.action.id,
    metadata: {
      style: styles,
      fromStyleBundle: bundle.name
    }
  }));
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frames = item.frames.filter(f => !_.has(f, 'metadata.fromStyleBundle'));
    props.onUpdateItem(
      i,
      update(item, { frames: { $set: frames.concat(newFrames) } })
    );
  }
}

export function addHierarchyFrame(
  hierarchy: string[],
  props: InputPanelProps | InputPaletteProps
) {
  let newFrame: ItemFrame = {
    fromActionId: props.action.id,
    metadata: {
      elementHierarchy: hierarchy
    }
  };
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frames = _.reject(
      item.frames,
      f => f.metadata && f.metadata.elementHierarchy
    );
    props.onUpdateItem(
      i,
      update(item, { frames: { $set: frames.concat([newFrame]) } })
    );
  }
}

export function updateTextFrame(
  newText: TextContent[],
  props: InputPanelProps | InputPaletteProps
) {
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frameIndex = _.findIndex(item.frames, f =>
      _.some(f.elements, { type: 'text' })
    );
    let elementIndex = _.findIndex(item.frames[frameIndex].elements, {
      type: 'text'
    });
    let element = item.frames[frameIndex].elements[elementIndex] as TextElement;
    let updatedElement = {
      ...element,
      content: newText
    };
    console.log('updating text element content', updatedElement);
    props.onUpdateItem(
      i,
      update(item, {
        frames: {
          [frameIndex]: {
            elements: { [elementIndex]: { $set: updatedElement } }
          }
        }
      })
    );
  }
}

export function removeStyleFrame(
  styles: Styles,
  props: InputPanelProps | InputPaletteProps
) {
  for (let i = 0; i < props.action.items.length; i++) {
    let item = props.action.items[i];
    let frames = item.frames.filter(
      f => !_.isEqual(_.get(f, 'metadata.style'), styles)
    );
    props.onUpdateItem(i, update(item, { frames: { $set: frames } }));
  }
}
