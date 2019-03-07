import * as React from 'react';
import { SketchPicker } from 'react-color';
import * as _ from 'lodash';

import { CSSColor } from '../../index';

import './ColorSelector.scss';

const DEFAULT_COLOR = '#42449b';

interface ColorSelectorProps {
  initialColor?: CSSColor;
  onColorChange: (newColor: CSSColor) => void;
}
interface ColorSelectorState {
  color: CSSColor;
}
export class ColorSelector extends React.Component<
  ColorSelectorProps,
  ColorSelectorState
> {
  constructor(props: ColorSelectorProps) {
    super(props);
    this.state = {
      color: props.initialColor || DEFAULT_COLOR
    };
  }

  render() {
    return (
      <div className="colorSelector">
        <SketchPicker
          color={this.state.color}
          onChange={({
            rgb: { r, g, b, a }
          }: {
            rgb: { r: number; g: number; b: number; a: number };
          }) => this.setState({ color: `rgba(${r},${g},${b},${a})` })}
        />
        <button
          className="colorSelector--addButton"
          onClick={() => this.props.onColorChange(this.state.color)}
        >
          Add color
        </button>
      </div>
    );
  }
}
