import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { Styles } from '../../../index';
import { prepareForTransition, doTransition } from './swatchTransitions';

import './ColorSwatch.scss';

interface ColorSwatchProps {
  styles: Styles;
  isSelected: boolean;
  retainElementForTransition?: boolean;
  transitionPreviousRetainedElement?: boolean;
  className?: string;
  onClick: () => any;
  onRemove: () => any;
}
interface ColorSwatchState {
  retaining: boolean;
  transitioning: boolean;
}
export class ColorSwatch extends React.Component<
  ColorSwatchProps,
  ColorSwatchState
> {
  private elRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: ColorSwatchProps) {
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
      doTransition(this.elRef.current, 'color', this.getTransitionKey()).then(
        () => this.setState({ transitioning: false })
      );
    }
  }

  render() {
    return (
      <div
        className={classNames('styleSwatch colorSwatch', this.props.className, {
          'is-selected': this.props.isSelected,
          'is-transitioning': this.state.transitioning,
          'is-retaining': this.state.retaining
        })}
        onClick={evt => this.onClick(evt)}
        style={{
          backgroundColor: _.first(this.props.styles.text.h1.textColors),
          backgroundImage:
            this.props.styles.text.h1.textMaskUrl &&
            `url(${this.props.styles.text.h1.textMaskUrl})`
        }}
        ref={this.elRef}
      >
        <button
          className="removeSwatch"
          onClick={evt => this.onRemoveClick(evt)}
        >
          Remove
        </button>
      </div>
    );
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
      prepareForTransition(
        this.elRef.current,
        'color',
        this.getTransitionKey()
      );
      this.setState({ retaining: true });
    }
  }

  private getTransitionKey() {
    return JSON.stringify(this.props.styles);
  }
}
