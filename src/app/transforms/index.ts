import * as _ from 'lodash';

import { applyElements } from './apply_elements';
import { styleImage } from './style_image';

import { PRESET_SIZES } from '../constants';
import {
  ActionItem,
  ActionSettings,
  ActionFunction,
  ActionTransform,
  StyleImageActionSettings,
  SelectStyleBundleActionSettings,
  ForegroundSourceActionSettings,
  BackgroundSourceActionSerttings
} from '../index';
import { getBackgroundGuidanceText } from '../ui/content/backgroundGuidance';

let noopFn: ActionFunction = (
  item: ActionItem,
  settings: ActionSettings,
  next: (item: ActionItem) => any
) => next(item);

export const TRANSFORMS: ActionTransform[] = [
  {
    name: 'Formats',
    title: 'Formats',
    guidance: "Add the formats you'll design for.",
    actionPanel: 'formats',
    fn: (item, settings, next) =>
      item === 'endOfBatch'
        ? next(item)
        : next({
            ...item,
            frames: [
              ...item.frames,
              {
                fromActionId: settings.actionId,
                metadata: { allSizes: PRESET_SIZES }
              }
            ]
          } as ActionItem),
    userSelectableResults: true
  },
  {
    name: 'Background Source',
    title: 'Background',
    guidance: getBackgroundGuidanceText,
    actionPanel: 'input',
    actionPanelProps: {
      stage: 'background'
    },
    fn: (item, settings: BackgroundSourceActionSerttings, next) => {
      return item === 'endOfBatch'
        ? next(item)
        : next({
            ...item,
            frames: [
              ...item.frames,
              {
                fromActionId: settings.actionId,
                metadata: { presetImages: settings.presetImages }
              }
            ]
          });
    },
    userSelectableResults: true
  },
  {
    name: 'Foreground Source',
    title: 'Logo',
    guidance: 'Optionally add a logo.',
    actionPanel: 'input',
    actionPanelProps: {
      stage: 'foreground'
    },
    fn: (item, settings: ForegroundSourceActionSettings, next) => {
      return item === 'endOfBatch'
        ? next(item)
        : next({
            ...item,
            frames: [
              ...item.frames,
              {
                fromActionId: settings.actionId,
                metadata: { presetImages: settings.presetImages }
              }
            ]
          });
    },
    userSelectableResults: true
  },
  {
    name: 'Select Style Bundle',
    title: 'Style',
    guidance: 'Build a visual style for your layout, or select a brand bundle.',
    actionPanel: 'input',
    actionPanelProps: {
      stage: 'styleBundle'
    },
    fn: (item, settings: SelectStyleBundleActionSettings, next) =>
      item === 'endOfBatch'
        ? next(item)
        : next({
            ...item,
            frames: [
              ...item.frames,
              {
                fromActionId: settings.actionId,
                metadata: { allStyleBundles: settings.allStyleBundles }
              }
            ]
          } as ActionItem),
    presetParameters: {},
    userSelectableResults: true
  },
  {
    name: 'Select Text Styles',
    title: 'Style',
    guidance: 'Select fonts and colors for your text content',
    actionPanel: 'input',
    actionPanelProps: {
      stage: 'textStyle',
      paletteFollowsSelectedElement: true
    },
    fn: (item, settings: StyleImageActionSettings, next) =>
      item === 'endOfBatch'
        ? next(item)
        : next({
            ...item,
            frames: [
              ...item.frames,
              {
                fromActionId: settings.actionId,
                metadata: { allStyles: settings.allStyles }
              }
            ]
          } as ActionItem),
    presetParameters: {},
    userSelectableResults: true
  },
  {
    name: 'Select Filter Styles',
    title: 'Style',
    guidance: 'Select visual treatments for your background image',
    actionPanel: 'input',
    actionPanelProps: {
      stage: 'filterStyle',
      paletteFollowsSelectedElement: true
    },
    fn: (item, settings: StyleImageActionSettings, next) =>
      item === 'endOfBatch'
        ? next(item)
        : next({
            ...item,
            frames: [
              ...item.frames,
              {
                fromActionId: settings.actionId,
                metadata: { allStyles: settings.allStyles }
              }
            ]
          } as ActionItem),
    presetParameters: {},
    userSelectableResults: true
  },
  {
    name: 'Style Image',
    actionPanel: 'output',
    fn: styleImage,
    presetParameters: {},
    runInWorker: true,
    userSelectableResults: false
  },
  {
    name: 'Customise Styles',
    title: 'Style',
    guidance: 'Finalise your visual style',
    actionPanel: 'input',
    actionPanelProps: {
      stage: 'customiseStyles',
      paletteFollowsSelectedElement: true
    },
    fn: noopFn,
    presetParameters: {},
    userSelectableResults: true
  },
  {
    name: 'Apply Elements',
    title: 'Outputs',
    guidance:
      "Explore the variations we've created, then edit and export your designs.",
    actionPanel: 'output',
    fn: applyElements,
    presetParameters: {},
    runInWorker: true,
    userSelectableResults: true
  },
  {
    name: 'Add Text',
    title: 'Text',
    guidance: "Add the text you'd like to include.",
    actionPanel: 'input',
    actionPanelProps: {
      stage: 'text'
    },
    fn: (item, settings, next) =>
      item === 'endOfBatch'
        ? next(item)
        : next({
            ...item,
            frames: [
              ...item.frames,
              {
                fromActionId: settings.actionId,
                elements: [{ id: _.uniqueId(), type: 'text', content: [] }],
                metadata: {}
              }
            ]
          } as ActionItem),

    presetParameters: {},
    userSelectableResults: true
  },
  {
    name: 'Organise Hierarchy',
    title: 'Hierarchy',
    guidance: 'Organise the elements by their importance',
    actionPanel: 'input',
    actionPanelProps: {
      stage: 'hierarchy'
    },
    fn: noopFn,
    presetParameters: {},
    userSelectableResults: true
  }
];
