import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { Styles } from '../../../index';

import './ColorStyleSelector.scss';

interface ColorStyleSelectorProps {
  styles: Styles[];
  isEnabled: boolean;
  onAddStyle: (styles: Styles) => void;
}
interface ColorStyleSelectorState {
  selectedStyle: Styles;
}
export class ColorStyleSelector extends React.Component<
  ColorStyleSelectorProps,
  ColorStyleSelectorState
> {
  constructor(props: ColorStyleSelectorProps) {
    super(props);
    this.state = { selectedStyle: null };
  }

  render() {
    return (
      <div className="paletteContent stylePalette colorStyleSelector">
        <div className="stylePalette--header">
          <h2>Text Colors</h2>
        </div>
        <div className="stylePalette--content">
          {this.props.styles.map((style, idx) => (
            <div
              className={classNames('colorStyleSelector--colorStyle', {
                'is-selected': style === this.state.selectedStyle
              })}
              key={idx}
              style={{
                backgroundColor: _.first(style.text.h1.textColors),
                backgroundImage:
                  style.text.h1.textMaskUrl &&
                  `url(${style.text.h1.textMaskUrl})`
              }}
              onClick={() => this.toggleSelectedStyle(style)}
            />
          ))}
        </div>
        <div className="stylePalette--footer">
          <button
            disabled={!this.props.isEnabled || !this.state.selectedStyle}
            onClick={() => this.props.onAddStyle(this.state.selectedStyle)}
          >
            Add Color
          </button>
        </div>
      </div>
    );
  }

  toggleSelectedStyle(style: Styles) {
    this.setState({
      selectedStyle: this.state.selectedStyle === style ? null : style
    });
  }
}
