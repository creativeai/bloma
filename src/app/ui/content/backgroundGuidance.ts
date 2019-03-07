import * as _ from 'lodash';

import { Action } from '../../index';
import { findElement, findInFrames } from '../../helpers/frames';

export function getBackgroundGuidanceText(action: Action) {
  let item = _.first(action.items);
  if (
    item &&
    findElement(item, 'background_image') &&
    action.state.activeCategory === 'image'
  ) {
    let hasAllObjects = findInFrames(item, 'metadata.allObjects');
    let hasSelectedObjects = findInFrames(item, 'metadata.objects');
    if (hasSelectedObjects) {
      return {
        key: 'bg-image-objects',
        content:
          'Please refine the boundary of your chosen object, and adjust the focal point detected, if required.'
      };
    } else if (hasAllObjects) {
      return {
        key: 'bg-image-all-objects',
        content:
          'We’ve detected the following objects within your image. Please select which you’d like to focus on.'
      };
    } else if (action.state.detecting) {
      return {
        key: 'bg-image-detecting',
        content: 'Detecting objects within your image, one moment please.'
      };
    } else {
      return {
        key: 'bg-start',
        content: 'Add a background image or flat color.'
      };
    }
  } else {
    return {
      key: 'bg-start',
      content: 'Add a background image or flat color.'
    };
  }
}
