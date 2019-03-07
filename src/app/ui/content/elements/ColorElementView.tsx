import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { BackgroundColorElement } from '../../../index';

import './ColorElementView.scss';

interface ColorElementViewProps {
  element: BackgroundColorElement;
  isSelected: boolean;
}

export class ColorElementView extends React.Component<ColorElementViewProps> {
  containerRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: ColorElementViewProps) {
    super(props);
  }

  render() {
    return (
      <div
        className={classNames('colorElementView', this.props.element.type, {
          'is-selected': this.props.isSelected
        })}
      >
        <div
          className="colorElementView--colorContainer"
          style={{ backgroundColor: this.props.element.color }}
        />
      </div>
    );
  }
}
