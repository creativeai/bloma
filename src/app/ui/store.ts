import * as update from 'immutability-helper';
import * as _ from 'lodash';

import { TRANSFORMS } from '../transforms/index';
import { PREPOP_WORKFLOWS } from '../workflows';

import {
  initTransformWorker,
  destroyTransformWorker,
  runTransform
} from '../transform-runner';
import { toZIP } from '../export';
import {
  ActionTransform,
  Workflow,
  Action,
  ActionItem,
  ActionCallback,
  Item,
  ItemFrame,
  ActionParameterValues
} from '../index';

// Redux-flavored state store + actions for UIs

export interface State {
  transforms: ActionTransform[];
  workflows: Workflow[];
  actions: Action[][];
  currentWorkflowId: string;
  currentActionIndex: [number, number];
  processingActionGroupIndex: number;
  directEdit?: { item: Item; index: number };
  paletteDismissed: boolean;
}
type RenderCallback = () => void;

export let state: State = {
  transforms: TRANSFORMS,
  workflows: PREPOP_WORKFLOWS,
  actions: [],
  currentWorkflowId: null,
  currentActionIndex: null,
  processingActionGroupIndex: null,
  paletteDismissed: false
};

export function openWorkflow(
  renderCallback: RenderCallback,
  workflow: Workflow,
  bypassWelcome = false
) {
  if (state.actions.length) {
    destroyTransformWorker();
  }
  let hasWelcome = workflow.actions[0][0].transform.actionPanel === 'welcome';
  initTransformWorker();
  state = {
    ...state,
    currentWorkflowId: _.uniqueId(),
    actions: workflow.actions,
    currentActionIndex: [0, 0],
    paletteDismissed: false
  };
  if (hasWelcome && bypassWelcome) {
    toggleSelectItem(0, true);
    proceedFromCurrentAction(renderCallback);
  }
}

export function updateActionParams(
  renderCallback: RenderCallback,
  newValues: ActionParameterValues,
  actionGroupIdx: number = state.currentActionIndex[0]
) {
  state = {
    ...state,
    actions: state.actions.map((actionGroup, groupIdx) => {
      if (groupIdx === actionGroupIdx) {
        let lastAction = _.last(actionGroup);
        let srcActionGroupIndex = actionGroupIdx - 1;
        let srcActionIndex = state.actions[srcActionGroupIndex].length - 1;
        let srcAction = state.actions[srcActionGroupIndex][srcActionIndex];
        let newAction: Action = {
          ...lastAction,
          id: _.uniqueId(),
          paramValues: { ...lastAction.paramValues, ...newValues },
          items: [],
          selectedIndexes: []
        };
        if (srcAction && srcAction.selectedIndexes.length) {
          setTimeout(
            () =>
              processChain(srcActionGroupIndex, srcActionIndex, renderCallback),
            0
          );
        }
        return actionGroup.concat([newAction]);
      } else {
        return actionGroup;
      }
    }),
    currentActionIndex: [actionGroupIdx, state.actions[actionGroupIdx].length]
  };
}

export function proceedFromCurrentAction(renderCallback: RenderCallback) {
  state = update(state, {
    actions: {
      [state.currentActionIndex[0]]: {
        [state.currentActionIndex[1]]: { hasProceeded: { $set: true } }
      }
    }
  });
  processChain(
    state.currentActionIndex[0],
    state.currentActionIndex[1],
    renderCallback
  );
}

function processItemsForAction(
  srcAction: Action,
  newActionGroupIdx: number,
  newActionIdx: number,
  renderCallback: RenderCallback,
  callback: RenderCallback = () => {}
) {
  let newAction = state.actions[newActionGroupIdx][newActionIdx];
  for (let itemIndex of srcAction.selectedIndexes) {
    runAction(newAction, [srcAction.items[itemIndex]], result => {
      state = update(state, {
        actions: {
          [newActionGroupIdx]: {
            [newActionIdx]: {
              items: { $push: [result] }
            }
          }
        }
      });
      if (!newAction.transform.userSelectableResults) {
        let newIndex =
          state.actions[newActionGroupIdx][newActionIdx].items.length - 1;
        state = update(state, {
          actions: {
            [newActionGroupIdx]: {
              [newActionIdx]: {
                selectedIndexes: { $push: [newIndex] }
              }
            }
          }
        });
      }
      renderCallback();
    });
  }
  runAction(newAction, ['endOfBatch'], callback);
}

function runAction(
  action: Action,
  items: ActionItem[],
  callback: ActionCallback,
  extraParams = {}
) {
  let paramValues = {
    ...(action.transform.presetParameters || {}),
    ...action.paramValues,
    ...extraParams,
    actionId: action.id
  };
  for (let item of items) {
    runTransform(action, item, paramValues, callback);
  }
}

function processChain(
  actionGroupIdx: number,
  actionIdx: number,
  renderCallback: RenderCallback
) {
  if (actionGroupIdx < state.actions.length - 1) {
    let nextActionGroupIdx = actionGroupIdx + 1;
    let nextActionIdx = state.actions[nextActionGroupIdx].length - 1;
    state = {
      ...state,
      currentActionIndex: [nextActionGroupIdx, nextActionIdx],
      processingActionGroupIndex: nextActionGroupIdx
    };

    let currentPanel =
      state.actions[actionGroupIdx][actionIdx].transform.actionPanel;
    let nextPanel =
      state.actions[nextActionGroupIdx][nextActionIdx].transform.actionPanel;
    let hasPanelSwitch = currentPanel !== nextPanel;

    let processNext = () =>
      processItemsForAction(
        state.actions[actionGroupIdx][actionIdx],
        nextActionGroupIdx,
        nextActionIdx,
        renderCallback,
        () => {
          state = update(state, {
            processingActionGroupIndex: { $set: null },
            actions: {
              [nextActionGroupIdx]: {
                [nextActionIdx]: {
                  isProcessed: { $set: true }
                }
              }
            }
          });
          renderCallback();
          if (
            !state.actions[nextActionGroupIdx][nextActionIdx].transform
              .userSelectableResults
          ) {
            processChain(nextActionGroupIdx, nextActionIdx, renderCallback);
          }
        }
      );

    // When panel switches, process the next action with an intermediate render to allow the next panel to show
    if (hasPanelSwitch) {
      renderCallback();
      setTimeout(processNext, 10);
    } else {
      processNext();
    }
  }
}

export function setCurrentActionIndex(groupIdx: number, actionIdx: number) {
  let actionGroup = state.actions[groupIdx];
  let updatedGroup = _.take(actionGroup, actionIdx)
    .concat(_.drop(actionGroup, actionIdx + 1))
    .concat([actionGroup[actionIdx]]);
  state = update(state, {
    actions: { [groupIdx]: { $set: updatedGroup } },
    currentActionIndex: { $set: [groupIdx, updatedGroup.length - 1] }
  });
}

export function toggleSelectItem(index: number, selected: boolean) {
  let [currentActionGroupIdx, currentActionIdx] = state.currentActionIndex;
  state = {
    ...state,
    actions: state.actions.map((actionGroup, groupIdx) => {
      if (groupIdx === currentActionGroupIdx) {
        return actionGroup.map((action, actionIdx) => {
          if (actionIdx === currentActionIdx) {
            return {
              ...action,
              selectedIndexes: selected
                ? _.uniq([...action.selectedIndexes, index])
                : _.reject(action.selectedIndexes, i => i === index)
            };
          } else {
            return action;
          }
        });
      } else {
        return actionGroup;
      }
    })
  };
}

export function updateItem(index: number, newItem: Item) {
  let [currentActionGroupIdx, currentActionIdx] = state.currentActionIndex;
  state = update(state, {
    actions: {
      [currentActionGroupIdx]: {
        [currentActionIdx]: { items: { [index]: { $set: newItem } } }
      }
    }
  });
}

export function setActionState(key: string, value: any) {
  let [currentActionGroupIdx, currentActionIdx] = state.currentActionIndex;
  state = update(state, {
    actions: {
      [currentActionGroupIdx]: {
        [currentActionIdx]: { state: { [key]: { $set: value } } }
      }
    }
  });
}

export function directEditItem(item: Item, index: number) {
  state = {
    ...state,
    directEdit: {
      item,
      index
    }
  };
}

export function directUpdateFrame(
  renderCallback: RenderCallback,
  frameIndex: number,
  newFrame: ItemFrame
) {
  state = update(state, {
    directEdit: { item: { frames: { [frameIndex]: { $set: newFrame } } } }
  });
  renderCallback();
}

export function directEditSave() {
  state = update(state, {
    actions: {
      [state.currentActionIndex[0]]: {
        [state.currentActionIndex[1]]: {
          items: { [state.directEdit.index]: { $set: state.directEdit.item } }
        }
      }
    },
    directEdit: { $set: null }
  });
}

export function directEditCancel() {
  state = {
    ...state,
    directEdit: null
  };
}

export function exportItems() {
  let [currentActionGroupIdx] = state.currentActionIndex;
  let actions = state.actions[currentActionGroupIdx];
  let items: Item[] = [];
  for (let action of actions) {
    items = items.concat(action.selectedIndexes.map(idx => action.items[idx]));
  }
  toZIP(items);
}

export function dismissPalette() {
  state = { ...state, paletteDismissed: true };
}
