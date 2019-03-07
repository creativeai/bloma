import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';

import '../scss/style.scss';

import {
  state,
  openWorkflow,
  updateActionParams,
  setCurrentActionIndex,
  toggleSelectItem,
  updateItem,
  setActionState,
  directEditItem,
  directUpdateFrame,
  directEditSave,
  directEditCancel,
  proceedFromCurrentAction,
  exportItems,
  dismissPalette
} from './ui/store';

import { App } from './ui/App';

let wrapperEl = document.querySelector('.main');

function render() {
  ReactDOM.render(renderApp(), wrapperEl);
}

function runAction(actionFn: (...a: any[]) => void, args: any = []) {
  actionFn(...args);
  render();
}

function renderApp() {
  return (
    <App
      state={state}
      onOpenWorkflow={(...a) => runAction(() => openWorkflow(render, ...a))}
      onParamValuesChange={(...a) =>
        runAction(() => updateActionParams(render, ...a))
      }
      onSetCurrentAction={(...a) => runAction(setCurrentActionIndex, a)}
      onToggleSelectItem={(...a) => runAction(toggleSelectItem, a)}
      onUpdateItem={(...a) => runAction(updateItem, a)}
      onSetActionState={(...a) => runAction(setActionState, a)}
      onDirectEditItem={(...a) => runAction(directEditItem, a)}
      onDirectUpdateFrame={(...a) =>
        runAction(() => directUpdateFrame(render, ...a))
      }
      onDirectEditSave={(...a) => runAction(directEditSave, a)}
      onDirectEditCancel={(...a) => runAction(directEditCancel, a)}
      onProceed={(...a) =>
        runAction(() => proceedFromCurrentAction(render, ...a))
      }
      onExport={(...a) => runAction(exportItems, a)}
      onDismissPalette={(...a) => runAction(dismissPalette, a)}
    />
  );
}

window.onload = () => {
  let loading = document.querySelector('.loading') as HTMLElement;
  loading.style.display = 'none';
  let main = document.querySelector('.main') as HTMLElement;
  main.style.display = 'grid';
};

render();
