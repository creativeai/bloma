import * as _ from 'lodash';

import { TRANSFORMS } from './transforms/index';

import { Workflow, Action, ItemFrame, StyleBundle, Styles } from './index';
import {
  DEMO_STYLE_BUNDLES,
  SPORTS_BRAND_TEXT_STYLES,
  SPORTS_BRAND_COLOR_TREATMENTS,
  CYBER_TEXT_STYLES,
  CYBER_COLOR_TREATMENTS,
  DEMO_BACKGROUND_IMAGE_PRESETS
} from './styles';

export const PREPOP_WORKFLOWS: Workflow[] = [
  buildBlomaWorkflow(
    'Demo',
    [],
    DEMO_STYLE_BUNDLES,
    SPORTS_BRAND_TEXT_STYLES.concat(CYBER_TEXT_STYLES),
    SPORTS_BRAND_COLOR_TREATMENTS.concat(CYBER_COLOR_TREATMENTS),
    {
      presetImages: DEMO_BACKGROUND_IMAGE_PRESETS
    }
  )
];

function buildBlomaWorkflow(
  name: string,
  presetForegroundImages: string[],
  styleBundles: StyleBundle[],
  textStyles: Styles[],
  filterStyles: Styles[],
  backgroundSourceParams = {}
) {
  return {
    name,
    actions: makeNewWorkflowWithWelcome(backgroundSourceParams).concat([
      [
        {
          id: _.uniqueId(),
          transform: _.find(TRANSFORMS, { name: 'Foreground Source' }),
          paramValues: {
            presetImages: presetForegroundImages
          },
          items: [],
          selectedIndexes: [],
          state: {}
        }
      ],
      [
        {
          id: _.uniqueId(),
          transform: _.find(TRANSFORMS, { name: 'Add Text' }),
          paramValues: {},
          items: [],
          selectedIndexes: [],
          state: {}
        }
      ],
      [
        {
          id: _.uniqueId(),
          transform: _.find(TRANSFORMS, { name: 'Organise Hierarchy' }),
          paramValues: {},
          items: [],
          selectedIndexes: [],
          state: {}
        }
      ],
      [
        {
          id: _.uniqueId(),
          transform: _.find(TRANSFORMS, { name: 'Select Style Bundle' }),
          paramValues: {
            allStyleBundles: styleBundles
          },
          items: [],
          selectedIndexes: [],
          state: {}
        }
      ],
      [
        {
          id: _.uniqueId(),
          transform: _.find(TRANSFORMS, { name: 'Select Text Styles' }),
          paramValues: {
            allStyles: textStyles
          },
          items: [],
          selectedIndexes: [],
          state: {}
        }
      ],
      [
        {
          id: _.uniqueId(),
          transform: _.find(TRANSFORMS, { name: 'Select Filter Styles' }),
          paramValues: {
            allStyles: filterStyles
          },
          items: [],
          selectedIndexes: [],
          state: {}
        }
      ],
      [
        {
          id: _.uniqueId(),
          transform: _.find(TRANSFORMS, { name: 'Style Image' }),
          paramValues: {},
          items: [],
          selectedIndexes: [],
          state: {}
        }
      ],
      [
        {
          id: _.uniqueId(),
          transform: _.find(TRANSFORMS, { name: 'Apply Elements' }),
          paramValues: {},
          items: [],
          selectedIndexes: [],
          state: {}
        }
      ]
    ])
  };
}

export function makeNewWorkflowWithWelcome(
  backgroundSourceParams = {},
  initFrames: ItemFrame[] = []
): Action[][] {
  let formatsTransform = _.find(TRANSFORMS, { name: 'Formats' });
  let imageSourceTransform = _.find(TRANSFORMS, { name: 'Background Source' });

  // Need a better way to do this - but we should run the first transform's action
  // before that action's panel is shown.
  let seedItem = { frames: initFrames };
  return [
    [
      {
        id: _.uniqueId(),
        transform: {
          name: 'Welcome',
          title: 'Welcome',
          actionPanel: 'welcome',
          fn: (item, settings, next) => next(item),
          userSelectableResults: true,
          hideBasket: true
        },
        paramValues: {},
        items: [seedItem],
        selectedIndexes: [],
        isProcessed: true,
        state: {}
      }
    ],
    [
      {
        id: _.uniqueId(),
        transform: formatsTransform,
        paramValues: {},
        items: [],
        selectedIndexes: [],
        isProcessed: true,
        state: {}
      }
    ],
    [
      {
        id: _.uniqueId(),
        transform: imageSourceTransform,
        paramValues: backgroundSourceParams,
        items: [],
        selectedIndexes: [],
        state: {}
      }
    ]
  ];
}
