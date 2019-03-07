import * as React from 'react';
import classNames from 'classnames';
import * as update from 'immutability-helper';
import * as _ from 'lodash';

import { findInFrames } from '../../../helpers/frames';
import { PanelProps } from '../PanelProps';

import './FormatsPanel.scss';
import { SizeFormat, SizeFormatGroup } from '../../../index';

interface FormatsPanelProps extends PanelProps {}
interface FormatsPanelState {
  activeCategory: SizeFormatGroup;
}
export class FormatsPanel extends React.Component<
  FormatsPanelProps,
  FormatsPanelState
> {
  constructor(props: FormatsPanelProps) {
    super(props);
    this.state = { activeCategory: null };
  }

  componentWillMount() {
    this.setState({
      activeCategory: _.first(this.getAllSizes())
    });
  }

  componentWillReceiveProps(newProps: FormatsPanelProps) {
    if (!_.isEqual(this.getAllSizes(newProps), this.getAllSizes(this.props))) {
      this.setState({
        activeCategory: _.first(this.getAllSizes(newProps))
      });
    }
  }

  render() {
    return (
      <div className="panel formatsPanel">
        <div className="panel--content formatsPanel--content">
          <div className="formatsPanel--formats">
            {/*<div className="formatsPanel--custom">
              <div className="formatsPanel--customCard">
                <div className="formatsPanel--customCardInner">
                  <span className="formatsPanel--customCardDimensions">
                    1200 x 900
                  </span>
                  <span className="formatsPanel--customCardName">
                    Custom
                  </span>
                </div>
              </div>
              <div className="formatsPanel--customInputs">
                <h2>Custom</h2>
                <div class="inputGroup">
                  <input id="formatInputWidth" type="number" value="1200" className="formatsPanel--inputWidth" />
                  <label for="formatInputWidth">W</label>
                </div>
                <div class="inputGroup">
                  <input id="formatInputHeight" type="number" value="900" className="formatsPanel--inputHeight" />
                  <label for="formatInputHeight">H</label>
                </div>
                <button class="formatsPanel--btnAddFormat">Add</button>
              </div>               
            </div>*/}
            {this.getSubCategories(this.state.activeCategory).map(
              ([category, sizes], idx) => (
                <div key={idx} className="formatsPanel--cardGroupWrapper">
                  <div
                    className={classNames(
                      'formatsPanel--cardGroup',
                      _.kebabCase(category)
                    )}
                  >
                    <h2 className="formatsPanel--cardGroupTitle">{category}</h2>
                    {sizes.map((size, idx) => this.renderSize(size, idx))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  renderSize(size: SizeFormat, idx: number, renderSelectedState = true) {
    return (
      <div
        key={idx}
        className={classNames('formatsPanel--card', {
          'is-selected':
            renderSelectedState && _.includes(this.getSelectedSizes(), size)
        })}
        ref={el => this.setAspectRatio(el, size)}
        onClick={() => this.toggleSelected(size)}
      >
        <div className="formatsPanel--cardInner">
          <span className="formatsPanel--cardDimensions">
            {size.width}x{size.height}
          </span>
          <span className="formatsPanel--cardName">
            {/* {size.category}
            <br /> */}
            {size.name}
          </span>
        </div>
      </div>
    );
  }

  getAllSizes(props: FormatsPanelProps = this.props): SizeFormatGroup[] {
    let item = _.first(props.action.items);
    return findInFrames(item, 'metadata.allSizes');
  }

  getSelectedSizes(): SizeFormat[] {
    let item = _.first(this.props.action.items);
    return findInFrames(item, 'metadata.sizes') || [];
  }

  getSubCategories(categories: SizeFormatGroup) {
    if (categories) {
      return _.toPairs(_.groupBy(categories.sizes, 'category'));
    } else {
      return [];
    }
  }

  toggleSelected(size: SizeFormat) {
    let item = _.first(this.props.action.items);
    let frame = item.frames[item.frames.length - 1];
    let selectedSizes = frame.metadata.sizes || [];
    let newSelectedSizes = _.includes(selectedSizes, size)
      ? _.without(selectedSizes, size)
      : [...selectedSizes, size];
    // Update item so that its metadata contains updated selected sizes.
    this.props.onUpdateItem(
      0,
      update(item, {
        frames: {
          [item.frames.length - 1]: {
            metadata: { sizes: { $set: newSelectedSizes } }
          }
        }
      })
    );
    // Toggle the selected state of the item - if there are any selected sizes the item itself
    // is considered selected and the user may proceed.
    this.props.onToggleSelectItem(0, !_.isEmpty(newSelectedSizes));
  }

  setAspectRatio(element: HTMLElement, size: SizeFormat) {
    if (element) {
      let ratio = size.height / size.width;
      element.style.setProperty('--aspect-ratio', '' + ratio);
    }
  }
}
