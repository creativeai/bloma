import * as React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import * as _ from 'lodash';

import { FontSwatch } from './FontSwatch';
import { Styles } from '../../../index';

import './FontSwatchSwitcher.scss';

interface FontSwatchSwitcherProps {
  styles: Styles[];
  selectedStyle: Styles;
  retainElementsForTransition: boolean;
  transitionPreviousRetainedElements: boolean;
  elementStyle?: React.CSSProperties;
  onSelect: (styles: Styles) => void;
  onRemove?: (styles: Styles) => void;
}

export class FontSwatchSwitcher extends React.Component<
  FontSwatchSwitcherProps
> {
  private swatchComponents: FontSwatch[] = [];

  render() {
    return (
      <TransitionGroup
        className="fontSwatchSwitcher"
        style={this.props.elementStyle}
      >
        {this.props.styles.map((style, idx) => (
          <CSSTransition key={idx} classNames="fontSwatch" timeout={300}>
            <FontSwatch
              className="fontSwatchSwitcher--swatch"
              fontFamily={style.text.h1.fontFamily}
              isAllCaps={style.text.h1.isAllCaps}
              isSelected={_.isEqual(style, this.props.selectedStyle)}
              retainElementForTransition={
                this.props.retainElementsForTransition
              }
              transitionPreviousRetainedElement={
                this.props.transitionPreviousRetainedElements
              }
              onClick={() => this.props.onSelect(style)}
              onRemove={() => this.props.onRemove(style)}
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
