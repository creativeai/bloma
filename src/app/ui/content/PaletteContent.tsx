import * as React from 'react';
import * as _ from 'lodash';

import { InputPalette } from './InputPalette';
import { Action, Item, ActionParameterValues } from '../../index';
import { WelcomePalette } from './WelcomePalette';
import { InputPanelStage } from './InputPanel';

interface PaletteContentProps {
  allActions: Action[][];
  currentActionIndex: [number, number];
  isProceedable: boolean;
  currentActionGroup: Action[];
  currentAction: Action;
  onParamValuesChange: (newValues: ActionParameterValues) => void;
  onSetCurrentActionIndex: (actionIndex: number) => void;
  onUpdateItem: (index: number, item: Item) => void;
  onToggleSelectItem: (index: number, selected: boolean) => void;
  onSetActionState: (key: string, value: any) => void;
  onDirectEditItem: (item: Item, index: number) => void;
  onProceed: () => void;
  onExport: () => void;
}
interface PaletteContentState {}
export class PaletteContent extends React.Component<
  PaletteContentProps,
  PaletteContentState
> {
  scheduledProgress: number;

  constructor(props: PaletteContentProps) {
    super(props);
  }

  private getStage(props: PaletteContentProps = this.props) {
    return (
      props.currentAction.transform.actionPanelProps &&
      props.currentAction.transform.actionPanelProps.stage
    );
  }

  render() {
    let type = this.props.currentAction.transform.actionPanel;
    switch (type) {
      case 'welcome':
        return <WelcomePalette />;
      case 'input':
        return (
          <InputPalette
            action={this.props.currentAction}
            allActions={this.props.allActions}
            currentActionIndex={this.props.currentActionIndex}
            isProceedable={this.props.isProceedable}
            onToggleSelectItem={this.props.onToggleSelectItem}
            onSetActionState={this.props.onSetActionState}
            onUpdateItem={this.props.onUpdateItem}
            onProceed={this.props.onProceed}
            {...this.props.currentAction.transform.actionPanelProps as {
              stage: InputPanelStage;
            }}
          />
        );
    }
    return null;
  }
}
