import * as React from 'react';
import { CSSTransition } from 'react-transition-group';
import * as _ from 'lodash';

import { OutputPanel } from './OutputPanel';
import { FormatsPanel } from './formats/FormatsPanel';
import { InputPanel, InputPanelStage } from './InputPanel';
import { WelcomePanel } from './WelcomePanel';

import './ContentArea.scss';
import {
  Action,
  Item,
  ActionParameterValues,
  ActionPanelType
} from '../../index';

interface ContentAreaProps {
  currentWorkflowId: string;
  allActions: Action[][];
  currentActionIndex: [number, number];
  isProceedable: boolean;
  currentActionGroup: Action[];
  currentAction: Action;
  onParamValuesChange: (newValues: ActionParameterValues) => void;
  onSetCurrentActionIndex: (actionIndex: number) => void;
  onUpdateItem: (index: number, item: Item) => void;
  onToggleSelectItem: (index: number, selected: boolean) => void;
  onDirectEditItem: (item: Item, index: number) => void;
  onSetActionState: (key: string, value: any) => void;
  onProceed: () => void;
  onExport: () => void;
  onDismissPalette: () => void;
}
interface ContentAreaState {}
export class ContentArea extends React.Component<
  ContentAreaProps,
  ContentAreaState
> {
  private scheduledProgress: number;
  private panelRefs: React.Component[] = [];

  constructor(props: ContentAreaProps) {
    super(props);
  }

  render() {
    return [
      ..._.uniq(this.props.allActions.map(a => a[0].transform.actionPanel)).map(
        (type, idx) => {
          let panel = this.renderPanel(type, idx);
          if (type === 'output') {
            return this.isIn(type) && panel;
          } else {
            return this.wrapTransition(idx, type, panel);
          }
        }
      )
    ];
  }

  renderPanel(type: ActionPanelType, idx: number) {
    let { action, actionGroup } = this.getActionForPanel(type);
    switch (type) {
      case 'welcome':
        return (
          <WelcomePanel
            key={`${this.props.currentWorkflowId}-${type}`}
            action={action}
            allActions={this.props.allActions}
            currentActionIndex={this.props.currentActionIndex}
            isProceedable={this.props.isProceedable}
            onToggleSelectItem={this.props.onToggleSelectItem}
            onUpdateItem={this.props.onUpdateItem}
            onProceed={this.props.onProceed}
            {...action.transform.actionPanelProps || {}}
            ref={cmp => (this.panelRefs[idx] = cmp)}
          />
        );
      case 'formats':
        return (
          <FormatsPanel
            key={`${this.props.currentWorkflowId}-${type}`}
            action={action}
            allActions={this.props.allActions}
            currentActionIndex={this.props.currentActionIndex}
            isProceedable={this.props.isProceedable}
            onToggleSelectItem={this.props.onToggleSelectItem}
            onUpdateItem={this.props.onUpdateItem}
            onProceed={this.props.onProceed}
            {...action.transform.actionPanelProps || {}}
            ref={cmp => (this.panelRefs[idx] = cmp)}
          />
        );
      case 'input':
        return (
          <InputPanel
            key={`${this.props.currentWorkflowId}-${type}`}
            action={action}
            allActions={this.props.allActions}
            currentActionIndex={this.props.currentActionIndex}
            isProceedable={this.props.isProceedable}
            onToggleSelectItem={this.props.onToggleSelectItem}
            onUpdateItem={this.props.onUpdateItem}
            onProceed={this.props.onProceed}
            onSetActionState={this.props.onSetActionState}
            {...action.transform.actionPanelProps as {
              stage: InputPanelStage;
            }}
            ref={cmp => (this.panelRefs[idx] = cmp)}
          />
        );
      case 'output':
        return (
          <OutputPanel
            key={`${this.props.currentWorkflowId}-${type}`}
            allActions={this.props.allActions}
            currentActionIndex={this.props.currentActionIndex}
            isProceedable={this.props.isProceedable}
            isLast={
              this.props.currentActionIndex[0] ===
              this.props.allActions.length - 1
            }
            action={action}
            actionGroup={actionGroup}
            isIn={this.isIn('output')}
            onParamValuesChange={this.props.onParamValuesChange}
            onSetCurrentActionIndex={this.props.onSetCurrentActionIndex}
            onToggleSelectItem={this.props.onToggleSelectItem}
            onUpdateItem={this.props.onUpdateItem}
            onDirectEditItem={this.props.onDirectEditItem}
            onProceed={this.props.onProceed}
            onDismissPalette={this.props.onDismissPalette}
            {...action.transform.actionPanelProps || {}}
            ref={cmp => (this.panelRefs[idx] = cmp)}
          />
        );
    }
  }

  getActionForPanel(type: ActionPanelType) {
    if (
      this.props.currentAction &&
      this.props.currentAction.transform.actionPanel === type
    ) {
      return {
        action: this.props.currentAction,
        actionGroup: this.props.currentActionGroup
      };
    } else {
      let lastGroup = _.findLast(
        this.props.allActions,
        g => _.last(g).transform.actionPanel === type
      );
      return { actionGroup: lastGroup, action: _.last(lastGroup) };
    }
  }

  isLastAction(action: Action) {
    let lastGroup = _.last(this.props.allActions);
    return lastGroup.indexOf(action) >= 0;
  }

  wrapTransition(idx: number, type: ActionPanelType, component: any) {
    return (
      component && (
        <CSSTransition
          key={idx}
          in={this.isIn(type)}
          timeout={{
            enter: 1000,
            exit: 500
          }}
          enter={this.hasEnterTransition(type)}
          classNames="panel"
          appear
          unmountOnExit
          onExit={() => this.onPanelExit(idx)}
        >
          {component}
        </CSSTransition>
      )
    );
  }

  private onPanelExit(idx: number) {
    let panel = this.panelRefs[idx];
    if (isExitable(panel)) {
      panel.onPanelExit();
    }
  }

  isIn(panel: ActionPanelType) {
    let currentAction = this.props.currentAction;
    if (panel === 'output') {
      // For inputs and outputs we don't require there to be items before the panel is shown.
      return currentAction.transform.actionPanel === panel;
    } else {
      return (
        currentAction.transform.actionPanel === panel &&
        currentAction.items.length > 0
      );
    }
  }

  hasEnterTransition(type: ActionPanelType) {
    return type !== 'input';
  }
}

interface ExitablePanel {
  onPanelExit: () => void;
}

function isExitable(panel: any): panel is ExitablePanel {
  return 'onPanelExit' in panel;
}
