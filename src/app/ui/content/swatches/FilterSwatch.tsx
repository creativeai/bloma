import * as React from 'react';
import classNames from 'classnames';

import { Styles } from '../../../index';
import { prepareForTransition, doTransition } from './swatchTransitions';

import './FilterSwatch.scss';

interface FilterSwatchProps {
  styles: Styles;
  isSelected: boolean;
  retainElementForTransition?: boolean;
  transitionPreviousRetainedElement?: boolean;
  className?: string;
  onClick: (styles: Styles) => any;
  onRemove: (styles: Styles) => any;
}
interface FilterSwatchState {
  retaining: boolean;
  transitioning: boolean;
}
export class FilterSwatch extends React.PureComponent<
  FilterSwatchProps,
  FilterSwatchState
> {
  private elRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: FilterSwatchProps) {
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
      doTransition(this.elRef.current, 'filter', this.getTransitionKey()).then(
        () => this.setState({ transitioning: false })
      );
    }
  }

  render() {
    return (
      <div
        className={classNames(
          'styleSwatch filterSwatch',
          this.props.className,
          {
            'is-selected': this.props.isSelected,
            'is-retaining': this.state.retaining,
            'is-transitioning': this.state.transitioning
          }
        )}
        onClick={this.onClick}
        ref={this.elRef}
      >
        <img src={this.props.styles.tileImg || this.generateTileImg()} />
        <button className="removeSwatch" onClick={this.onRemoveClick}>
          Remove
        </button>
      </div>
    );
  }

  onClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    this.props.onClick(this.props.styles);
  };

  onRemoveClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    this.props.onRemove(this.props.styles);
  };

  onPanelExit() {
    if (this.props.retainElementForTransition) {
      prepareForTransition(
        this.elRef.current,
        'filter',
        this.getTransitionKey()
      );
      this.setState({ retaining: true });
    }
  }

  private getTransitionKey() {
    return JSON.stringify(this.props.styles);
  }

  private generateTileImg() {
    if (this.props.styles.colorBlend) {
      let blendColor = this.props.styles.colorBlend.color;
      let canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      let ctx = canvas.getContext('2d');
      ctx.fillStyle = blendColor;
      ctx.fillRect(0, 0, 300, 300);
      return canvas.toDataURL('image/jpeg');
    } else {
      return null;
    }
  }
}
