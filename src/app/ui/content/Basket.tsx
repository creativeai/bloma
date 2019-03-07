import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { findInFrames } from '../../helpers/frames';
import { SizeFormat, Action, Item } from '../../index';
import { renderFlat } from '../../helpers/images';

import './Basket.scss';

const ACTIVE_PERIOD_AFTER_CHANGE_MS = 2000;

interface SelectedRender {
  size: SizeFormat;
  item: Item;
  render: string;
}
interface BasketProps {
  actions: Action[][];
  onExport: () => void;
}
interface BasketState {
  hover: boolean;
  recentChanges: number;
  latestSelectedRenders: SelectedRender[];
}
export class Basket extends React.Component<BasketProps, BasketState> {
  constructor(props: BasketProps) {
    super(props);
    this.state = {
      hover: false,
      recentChanges: 0,
      latestSelectedRenders: []
    };
  }

  componentWillReceiveProps(newProps: BasketProps) {
    let previousCount = this.getSelectedSizes(this.props).length;
    let newCount = this.getSelectedSizes(newProps).length;
    let anyChanges = previousCount !== newCount;

    let renders = this.state.latestSelectedRenders;
    for (let size of this.getSelectedSizes(newProps)) {
      let item = this.getLatestSelectedItem(size, newProps);
      let previousRender = _.find(renders, r => _.isEqual(r.size, size));
      if (item && (!previousRender || previousRender.item !== item)) {
        let newRender = {
          item,
          size,
          render: renderFlat(item, item.frames.map(f => f.name), 300)
        };
        renders = _.without(renders, previousRender).concat([newRender]);
        anyChanges = true;
      } else if (!item && previousRender) {
        renders = _.without(renders, previousRender);
        anyChanges = true;
      }
    }
    this.setState({ latestSelectedRenders: renders });

    // If number of selected sizes has changed...
    if (anyChanges) {
      // ...set active state...
      this.setState({ recentChanges: this.state.recentChanges + 1 });
      // ...and then unset after a few moments.
      setTimeout(
        () => this.setState({ recentChanges: this.state.recentChanges - 1 }),
        ACTIVE_PERIOD_AFTER_CHANGE_MS
      );
    }
  }

  render() {
    let selectedSizes = this.getSelectedSizes();
    let allSelectedItems = this.getAllSelectedItems();
    return (
      <div
        className={classNames('basket', {
          'is-active': this.isActive(),
          'is-populated': !_.isEmpty(selectedSizes)
        })}
        onMouseEnter={() => this.setState({ hover: true })}
        onMouseLeave={() => this.setState({ hover: false })}
      >
        <button className="basket--btn">Basket</button>
        <div className="basket--dropdown">
          <div className="basket--dropdownColumn">
            {selectedSizes.map(
              (size, idx) => idx % 2 === 0 && this.renderFormatCard(size, idx)
            )}
          </div>
          <div className="basket--dropdownColumn">
            {selectedSizes.map(
              (size, idx) => idx % 2 !== 0 && this.renderFormatCard(size, idx)
            )}
          </div>
          <button
            className="btn--export"
            onClick={this.onDownload}
            disabled={_.isEmpty(allSelectedItems)}
          >
            Export
          </button>
        </div>
      </div>
    );
  }

  private renderFormatCard(size: SizeFormat, idx: number) {
    let selectedItemCount = this.getSelectedItemCount(size);
    let selectedRender = _.find(this.state.latestSelectedRenders, r =>
      _.isEqual(r.size, size)
    );
    return (
      <div
        key={idx}
        className="basket--formatCard"
        ref={el => this.setAspectRatio(el, size)}
      >
        {selectedRender && (
          <img
            className="basket--formatCardSelectedRender"
            src={selectedRender.render}
          />
        )}
        <div className="basket--formatCardInner">
          {!selectedRender && (
            <span className="basket--formatCardDimensions">
              {size.width}x{size.height}
            </span>
          )}
          {!selectedRender && (
            <span className="basket--formatCardName">
              {size.name}
              {/* {size.category} */}
            </span>
          )}
          {selectedItemCount > 0 && (
            <span className="basket--formatCardSelectionCount">
              {selectedItemCount}
            </span>
          )}
        </div>
      </div>
    );
  }

  setAspectRatio(element: HTMLElement, size: SizeFormat) {
    if (element) {
      let ratio = size.height / size.width;
      element.style.setProperty('--aspect-ratio', '' + ratio);
    }
  }

  isActive() {
    return this.state.hover || this.state.recentChanges > 0;
  }

  getSelectedSizes(props = this.props): SizeFormat[] {
    let item = this.getLatestItem(props);
    if (item) {
      return findInFrames(item, 'metadata.sizes') || [];
    } else {
      return [];
    }
  }

  getLatestItem(props: BasketProps) {
    for (let i = props.actions.length - 1; i >= 0; i--) {
      let group = props.actions[i];
      for (let j = group.length - 1; j >= 0; j--) {
        if (!_.isEmpty(group[j].items)) {
          return _.first(group[j].items);
        }
      }
    }
  }

  private getSelectedItemCount(size: SizeFormat) {
    return this.getSelectedItems(size).length;
  }

  private getLatestSelectedItem(
    size: SizeFormat,
    props: BasketProps = this.props
  ) {
    return _.last(this.getSelectedItems(size, props));
  }

  private getSelectedItems(size: SizeFormat, props: BasketProps = this.props) {
    let outputActions = _.last(props.actions);
    let allSelectedItems: Item[] = [];
    for (let action of outputActions) {
      let selectedIndexes = action.selectedIndexes;
      let selectedItems = selectedIndexes.map(idx => action.items[idx]);
      allSelectedItems = allSelectedItems.concat(
        selectedItems.filter(item =>
          _.isEqual(findInFrames(item, 'metadata.size'), size)
        )
      );
    }
    return allSelectedItems;
  }

  private getAllSelectedItems() {
    let all: Item[] = [];
    for (let size of this.getSelectedSizes()) {
      all = all.concat(this.getSelectedItems(size));
    }
    return all;
  }

  private onDownload = () => {
    this.props.onExport();
  };
}
