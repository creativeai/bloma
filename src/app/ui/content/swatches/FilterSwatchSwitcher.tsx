import * as React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import * as _ from 'lodash';

import { Styles } from '../../../index';
import { FilterSwatch } from './FilterSwatch';

import './FilterSwatchSwitcher.scss';

interface FilterSwatchSwitcherProps {
  styles: Styles[];
  selectedStyle: Styles;
  retainElementsForTransition: boolean;
  transitionPreviousRetainedElements: boolean;
  elementStyle?: React.CSSProperties;
  onSelect: (style: Styles) => void;
  onRemove?: (style: Styles) => void;
}
export class FilterSwatchSwitcher extends React.Component<
  FilterSwatchSwitcherProps
> {
  private swatchComponents: FilterSwatch[] = [];

  render() {
    return (
      <TransitionGroup
        className="filterSwatchSwitcher"
        style={this.props.elementStyle}
      >
        {this.props.styles.map((styles, idx) => (
          <CSSTransition key={idx} classNames="filterSwatch" timeout={300}>
            <FilterSwatch
              styles={styles}
              isSelected={_.isEqual(this.props.selectedStyle, styles)}
              retainElementForTransition={
                this.props.retainElementsForTransition
              }
              transitionPreviousRetainedElement={
                this.props.transitionPreviousRetainedElements
              }
              className="filterSwatchSwitcher--swatch"
              onClick={this.props.onSelect}
              onRemove={this.props.onRemove}
              ref={cmp => (this.swatchComponents[idx] = cmp)}
            />
          </CSSTransition>
        ))}
      </TransitionGroup>
    );
  }

  onPanelExit() {
    for (let cmp of this.swatchComponents) {
      if (cmp) {
        cmp.onPanelExit();
      }
    }
  }
}
