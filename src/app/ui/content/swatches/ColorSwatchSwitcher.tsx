import * as React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import * as _ from 'lodash';

import { Styles } from '../../../index';
import { ColorSwatch } from './ColorSwatch';

import './ColorSwatchSwitcher.scss';

interface ColorSwatchSwitcherProps {
  styles: Styles[];
  selectedStyle: Styles;
  retainElementsForTransition: boolean;
  transitionPreviousRetainedElements: boolean;
  elementStyle?: React.CSSProperties;
  onSelect: (style: Styles) => void;
  onRemove?: (style: Styles) => void;
}
export class ColorSwatchSwitcher extends React.Component<
  ColorSwatchSwitcherProps
> {
  private swatchComponents: ColorSwatch[] = [];

  render() {
    return (
      <TransitionGroup
        className="colorSwatchSwitcher"
        style={this.props.elementStyle}
      >
        {this.props.styles.map((styles, idx) => (
          <CSSTransition key={idx} classNames="colorSwatch" timeout={300}>
            <ColorSwatch
              styles={styles}
              isSelected={_.isEqual(this.props.selectedStyle, styles)}
              retainElementForTransition={
                this.props.retainElementsForTransition
              }
              transitionPreviousRetainedElement={
                this.props.transitionPreviousRetainedElements
              }
              className="colorSwatchSwitcher--swatch"
              onClick={() => this.props.onSelect(styles)}
              onRemove={() => this.props.onRemove(styles)}
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
