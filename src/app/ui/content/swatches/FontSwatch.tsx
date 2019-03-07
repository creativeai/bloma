import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { FontFamily } from '../../../index';
import { FontStyles } from '../styles/FontStyles';
import { prepareForTransition, doTransition } from './swatchTransitions';
import { FONTS } from '../../../fonts';

import './FontSwatch.scss';

interface FontSwatchProps {
  fontFamily: FontFamily;
  isAllCaps?: boolean;
  isSelected: boolean;
  retainElementForTransition?: boolean;
  transitionPreviousRetainedElement?: boolean;
  className?: string;
  onClick: () => any;
  onRemove: () => any;
}
interface FontSwatchState {
  retaining: boolean;
  transitioning: boolean;
}
export class FontSwatch extends React.Component<
  FontSwatchProps,
  FontSwatchState
> {
  private elRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: FontSwatchProps) {
    super(props);
    this.state = { retaining: false, transitioning: false };
  }

  componentWillMount() {
    if (this.props.transitionPreviousRetainedElement) {
      this.setState({ transitioning: true });
    }
  }

  componentDidMount() {
    if (this.props.transitionPreviousRetainedElement) {
      doTransition(this.elRef.current, 'font', this.getTransitionKey()).then(
        () => this.setState({ transitioning: false })
      );
    }
  }

  render() {
    return (
      <div
        className={classNames('styleSwatch fontSwatch', this.props.className, {
          'is-selected': this.props.isSelected,
          'is-retaining': this.state.retaining,
          'is-transitioning': this.state.transitioning
        })}
        style={{ fontFamily: this.props.fontFamily }}
        onClick={evt => this.onClick(evt)}
        ref={this.elRef}
      >
        <FontStyles fonts={[this.getFont()]} />
        {this.props.isAllCaps ? 'AG' : 'Ag'}
        <button
          className="removeSwatch"
          onClick={evt => this.onRemoveClick(evt)}
        >
          Remove
        </button>
      </div>
    );
  }

  getFont() {
    return _.find(FONTS, { key: this.props.fontFamily });
  }

  onClick(evt: React.MouseEvent) {
    evt.stopPropagation();
    this.props.onClick();
  }

  onRemoveClick(evt: React.MouseEvent) {
    evt.stopPropagation();
    this.props.onRemove();
  }

  onPanelExit() {
    if (this.props.retainElementForTransition) {
      prepareForTransition(this.elRef.current, 'font', this.getTransitionKey());
      this.setState({ retaining: true });
    }
  }

  private getTransitionKey() {
    return this.props.fontFamily + this.props.isAllCaps;
  }
}
