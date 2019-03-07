import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';
import { CSSTransition } from 'react-transition-group';
import { GatewayDest, GatewayProvider } from 'react-gateway';

import { ContentArea } from './content/ContentArea';
import { Basket } from './content/Basket';
import { Palette } from './content/Palette';
import { PaletteContent } from './content/PaletteContent';
import { DirectEditor } from './dm/DirectEditor';
import { RestartButton } from './content/RestartButton';

import { ActionParameterValues, Item, ItemFrame, Workflow } from '../index';
import { State } from './store';

import './StandaloneWorkflow.scss';

interface StandaloneWorkflowProps {
  workflowName: string;
  state: State;
  onSetCurrentAction: (groupIdx: number, actionIdx: number) => void;
  onParamValuesChange: (newValues: ActionParameterValues) => void;
  onSetActionState: (key: string, value: any) => void;
  onUpdateItem: (itemIdx: number, newItem: Item) => void;
  onToggleSelectItem: (itemIdx: number, selected: boolean) => void;
  onDirectEditItem: (item: Item, index: number) => void;
  onDirectUpdateFrame: (index: number, frame: ItemFrame) => void;
  onDirectEditSave: () => void;
  onDirectEditCancel: () => void;
  onProceed: () => void;
  onExport: () => void;
  onDismissPalette: () => void;
  onOpenWorkflow: (workflow: Workflow, bypassWelcome?: boolean) => void;
}
export class StandaloneWorkflow extends React.Component<
  StandaloneWorkflowProps
> {
  componentWillMount() {
    this.openWorkflow();
  }

  render() {
    let contentActionGroup =
      this.props.state.currentActionIndex &&
      this.props.state.actions[this.props.state.currentActionIndex[0]];
    let contentAction =
      contentActionGroup &&
      contentActionGroup[this.props.state.currentActionIndex[1]];
    return (
      <GatewayProvider>
        <div
          className={classNames(
            'standaloneWorkflow',
            contentAction && `action-${contentAction.transform.actionPanel}`,
            {
              'is-proceedable': this.isProceedable()
            }
          )}
        >
          <main className="content">
            {contentAction && !contentAction.transform.hideBasket && (
              <Basket
                actions={this.props.state.actions}
                onExport={this.props.onExport}
              />
            )}
            <CSSTransition
              in={!this.props.state.paletteDismissed}
              classNames="palette"
              timeout={300}
            >
              <Palette
                action={contentAction}
                isProceedable={this.isProceedable()}
                isDismissed={this.props.state.paletteDismissed}
                onProceed={this.props.onProceed}
              >
                {contentAction && (
                  <PaletteContent
                    currentActionIndex={this.props.state.currentActionIndex}
                    currentActionGroup={contentActionGroup}
                    currentAction={contentAction}
                    allActions={this.props.state.actions}
                    isProceedable={this.isProceedable()}
                    onParamValuesChange={this.props.onParamValuesChange}
                    onSetCurrentActionIndex={actionIndex =>
                      this.props.onSetCurrentAction(
                        this.props.state.currentActionIndex[0],
                        actionIndex
                      )
                    }
                    onToggleSelectItem={this.props.onToggleSelectItem}
                    onUpdateItem={this.props.onUpdateItem}
                    onSetActionState={this.props.onSetActionState}
                    onDirectEditItem={this.props.onDirectEditItem}
                    onProceed={this.props.onProceed}
                    onExport={this.props.onExport}
                  />
                )}
              </Palette>
            </CSSTransition>
            <RestartButton onRestart={() => this.openWorkflow(true)} />
            {contentAction && (
              <ContentArea
                key="content"
                currentWorkflowId={this.props.state.currentWorkflowId}
                currentActionIndex={this.props.state.currentActionIndex}
                currentActionGroup={contentActionGroup}
                currentAction={contentAction}
                allActions={this.props.state.actions}
                isProceedable={this.isProceedable()}
                onParamValuesChange={this.props.onParamValuesChange}
                onSetCurrentActionIndex={actionIndex =>
                  this.props.onSetCurrentAction(
                    this.props.state.currentActionIndex[0],
                    actionIndex
                  )
                }
                onToggleSelectItem={this.props.onToggleSelectItem}
                onUpdateItem={this.props.onUpdateItem}
                onSetActionState={this.props.onSetActionState}
                onDirectEditItem={this.props.onDirectEditItem}
                onProceed={this.props.onProceed}
                onExport={this.props.onExport}
                onDismissPalette={this.props.onDismissPalette}
              />
            )}
            <CSSTransition
              classNames="directEditor"
              timeout={500}
              in={!!this.props.state.directEdit}
              mountOnEnter
              unmountOnExit
            >
              <DirectEditor
                item={
                  this.props.state.directEdit &&
                  this.props.state.directEdit.item
                }
                onUpdateFrame={this.props.onDirectUpdateFrame}
                onSave={this.props.onDirectEditSave}
                onCancel={this.props.onDirectEditCancel}
              />
            </CSSTransition>
          </main>
          <footer className="footer" />
          <GatewayDest name="modal" />
        </div>
      </GatewayProvider>
    );
  }

  isProceedable() {
    let actionIdx = this.props.state.currentActionIndex;
    let action =
      actionIdx && this.props.state.actions[actionIdx[0]][actionIdx[1]];
    return (
      action &&
      actionIdx[0] < this.props.state.actions.length - 1 &&
      action.transform.userSelectableResults &&
      action.selectedIndexes.length > 0 &&
      !action.hasProceeded
    );
  }

  openWorkflow(bypassWelcome = false) {
    let workflowName = this.props.workflowName;
    let workflow = _.find(this.props.state.workflows, { name: workflowName });
    this.props.onOpenWorkflow(workflow, bypassWelcome);
  }
}
