import * as React from 'react';
import * as _ from 'lodash';

import { Image } from '../Image';
import { PanelProps } from './PanelProps';
import { SwatchSwitchers } from './swatches/SwatchSwitchers';
import {
  SizeFormat,
  Item,
  ActionParameterValues,
  Action,
  ElementType,
  Styles
} from '../../index';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import {
  findInFrames,
  getStyles,
  getStylesWithProperty,
  getTextStyles,
  getBackgroundColorStyles,
  getTextColorStyles
} from '../../helpers/frames';

import { MAX_ITEMS_TO_GENERATE_PER_COMBINATION } from '../../constants';

import './OutputPanel.scss';

interface OutputPanelProps extends PanelProps {
  isIn: boolean;
  isLast: boolean;
  actionGroup: Action[];
  onParamValuesChange: (values: ActionParameterValues) => void;
  onSetCurrentActionIndex: (actionIndex: number) => void;
  onDirectEditItem: (item: Item, index: number) => void;
  onDismissPalette: () => void;
}

interface OutputPanelState {
  activeSize: SizeFormat;
  activeTextStyle: Styles;
  activeTextColor: Styles;
  activeFilterStyle: Styles;
  outputsWidth: number;
}

export class OutputPanel extends React.Component<
  OutputPanelProps,
  OutputPanelState
> {
  constructor(props: OutputPanelProps) {
    super(props);
    this.state = {
      activeSize: null,
      activeTextStyle: null,
      activeTextColor: null,
      activeFilterStyle: null,
      outputsWidth: 0
    };
  }

  componentWillMount() {
    this.setDefaultSelections(this.props);
  }

  componentWillReceiveProps(newProps: OutputPanelProps) {
    this.setDefaultSelections(newProps);
  }

  setDefaultSelections(props: OutputPanelProps) {
    if (props.actionGroup.length && props.isLast && !this.state.activeSize) {
      this.setActiveSelections(
        _.first(this.getSizes(props)),
        _.first(this.getTextStyles(props)),
        _.first(this.getTextColorStyles(props)),
        _.first(this.getBackgroundColorStyles(props))
      );
    }
  }

  changeActiveTextFormat = (size: SizeFormat) => {
    this.setActiveSelections(
      size,
      this.state.activeTextStyle,
      this.state.activeTextColor,
      this.state.activeFilterStyle
    );
    this.props.onDismissPalette();
  };

  changeActiveTextStyle = (style: Styles) => {
    this.setActiveSelections(
      this.state.activeSize,
      style,
      this.state.activeTextColor,
      this.state.activeFilterStyle
    );
    this.props.onDismissPalette();
  };

  changeActiveTextColor = (style: Styles) => {
    this.setActiveSelections(
      this.state.activeSize,
      this.state.activeTextStyle,
      style,
      this.state.activeFilterStyle
    );
    this.props.onDismissPalette();
  };

  changeActiveFilterStyle = (style: Styles) => {
    this.setActiveSelections(
      this.state.activeSize,
      this.state.activeTextStyle,
      this.state.activeTextColor,
      style
    );
    this.props.onDismissPalette();
  };

  setActiveSelections(
    size: SizeFormat,
    textStyle: Styles,
    textColor: Styles,
    filterStyle: Styles
  ) {
    this.setState(
      {
        activeSize: size,
        activeTextStyle: textStyle,
        activeTextColor: textColor,
        activeFilterStyle: filterStyle
      },
      () => {
        let existingActionIndex = _.findIndex(
          this.props.actionGroup,
          action => this.getItemsForActiveSelections(action).length > 0
        );
        if (existingActionIndex >= 0) {
          this.props.onSetCurrentActionIndex(existingActionIndex);
        } else {
          // Change param values causing action rerun, generating the items
          this.props.onParamValuesChange({
            selectedSize: this.state.activeSize,
            selectedTextStyle: this.state.activeTextStyle,
            selectedTextColor: this.state.activeTextColor,
            selectedFilterStyle: this.state.activeFilterStyle
          });
        }
      }
    );
  }

  render() {
    let items = this.getItemsForActiveSelections();
    return (
      <div
        className="panel outputsPanel"
        ref={(el: HTMLDivElement) => this.updateOutputsWidth(el)}
      >
        <div className="outputsPanel--content">
          <CSSTransition
            classNames="swatchSwitchers"
            in={this.props.isIn}
            timeout={2000}
            appear
          >
            <SwatchSwitchers
              sizeFormats={this.getSizes()}
              textStyles={this.getTextStyles()}
              textColors={this.getTextColorStyles()}
              filterStyles={this.getBackgroundColorStyles()}
              activeSizeFormat={this.state.activeSize}
              activeTextStyle={this.state.activeTextStyle}
              activeTextColor={this.state.activeTextColor}
              activeFilterStyle={this.state.activeFilterStyle}
              onChangeActiveSizeFormat={this.changeActiveTextFormat}
              onChangeActiveTextStyle={this.changeActiveTextStyle}
              onChangeActiveTextColor={this.changeActiveTextColor}
              onChangeActiveFilterStyle={this.changeActiveFilterStyle}
            />
          </CSSTransition>
          <TransitionGroup className="outputsPanel--outputsWrapper">
            <CSSTransition
              key={this.getParametersKey()}
              classNames="outputsPanel--outputs"
              timeout={1000}
              appear
            >
              <div className="outputsPanel--outputs">
                {this.state.outputsWidth &&
                  this.state.activeSize &&
                  _.range(MAX_ITEMS_TO_GENERATE_PER_COMBINATION).map(index => (
                    <Image
                      key={this.getImageKey(index)}
                      item={items[index] && items[index].item}
                      width={(this.state.outputsWidth / 5) * 2}
                      aspectRatio={
                        this.state.activeSize.width /
                        this.state.activeSize.height
                      }
                      isSelected={
                        items[index] &&
                        _.includes(
                          this.props.action.selectedIndexes,
                          items[index].index
                        )
                      }
                      onToggleSelect={selected => {
                        if (items[index]) {
                          this.props.onToggleSelectItem(
                            items[index].index,
                            selected
                          );
                          this.props.onDismissPalette();
                        }
                      }}
                      onDirectEdit={() => {
                        if (items[index]) {
                          this.props.onDirectEditItem(
                            items[index].item,
                            items[index].index
                          );
                          this.props.onDismissPalette();
                        }
                      }}
                    />
                  ))}
              </div>
            </CSSTransition>
          </TransitionGroup>
        </div>
      </div>
    );
  }

  getAllSelectedItems() {
    let items: Item[] = [];
    for (let action of this.props.actionGroup) {
      items = items.concat(
        action.selectedIndexes.map(idx => action.items[idx])
      );
    }
    return items;
  }

  getParametersKey() {
    let key = '';
    if (this.state.activeSize) {
      key += this.state.activeSize.category + this.state.activeSize.name;
    }
    if (this.state.activeFilterStyle) {
      key += this.state.activeFilterStyle.name;
    }
    if (this.state.activeTextStyle) {
      key += this.state.activeTextStyle.name;
    }
    if (this.state.activeTextColor) {
      key += this.state.activeTextColor.name;
    }
    return key;
  }

  getImageKey(index: number) {
    let key = this.getParametersKey();
    key += index;
    return key;
  }

  updateOutputsWidth(element: HTMLDivElement) {
    if (element && this.state.outputsWidth !== element.offsetWidth) {
      setTimeout(() => this.setState({ outputsWidth: element.offsetWidth }), 0);
    }
  }

  getSizes(props = this.props) {
    let item = this.getLastItemFromAnyAction(props);
    if (item) {
      return (findInFrames(item, 'metadata.sizes') as SizeFormat[]) || [];
    }
    return [];
  }

  getItemsForActiveSelections(action: Action = this.props.action) {
    return action.items
      .map((item, index) => ({ item, index }))
      .filter(i => findInFrames(i.item, 'layer'))
      .filter(
        i =>
          _.isEqual(
            findInFrames(i.item, 'metadata.size'),
            this.state.activeSize
          ) &&
          this.matchesCurrentTextStyle(i.item) &&
          this.matchesCurrentTextColor(i.item) &&
          this.matchesCurrentFilterStyle(i.item)
      );
  }

  matchesCurrentTextStyle(item: Item) {
    return this.state.activeTextStyle
      ? _.isEqual(
          findInFrames(item, 'metadata.textStyle.name'),
          this.state.activeTextStyle.name
        )
      : !findInFrames(item, 'metadata.textStyle.name');
  }

  matchesCurrentTextColor(item: Item) {
    return this.state.activeTextColor
      ? _.isEqual(
          findInFrames(item, 'metadata.textColor.name'),
          this.state.activeTextColor.name
        )
      : !findInFrames(item, 'metadata.textColor.name');
  }

  matchesCurrentFilterStyle(item: Item) {
    return this.state.activeFilterStyle
      ? _.isEqual(
          findInFrames(item, 'metadata.filterStyle.name'),
          this.state.activeFilterStyle.name
        )
      : !findInFrames(item, 'metadata.filterStyle.name');
  }

  getTextStyles(props: OutputPanelProps = this.props) {
    return getTextStyles(this.getLastItemFromAnyAction(props));
  }

  getTextColorStyles(props: OutputPanelProps = this.props) {
    return getTextColorStyles(this.getLastItemFromAnyAction(props));
  }

  getBackgroundColorStyles(props: OutputPanelProps = this.props) {
    return getBackgroundColorStyles(this.getLastItemFromAnyAction(props));
  }

  private getLastItemFromAnyAction(props: OutputPanelProps) {
    for (
      let groupIdx = props.allActions.length - 1;
      groupIdx >= 0;
      groupIdx--
    ) {
      for (
        let actionIdx = props.allActions[groupIdx].length - 1;
        actionIdx >= 0;
        actionIdx--
      ) {
        let action = props.allActions[groupIdx][actionIdx];
        if (action.items.length) {
          return _.first(action.items);
        }
      }
    }
  }
}
