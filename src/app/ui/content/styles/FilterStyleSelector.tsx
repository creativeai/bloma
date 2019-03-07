import * as React from 'react';
import classNames from 'classnames';

import { Styles, Action } from '../../../index';

import './FilterStyleSelector.scss';

interface FilterStyleSelectorProps {
  action: Action;
  styles: Styles[];
  isEnabled: boolean;
  onAddStyle: (styles: Styles) => void;
  onSetActionState: (key: string, value: any) => void;
}
interface FilterStyleSelectorState {
  selectedStyle: Styles;
}
export class FilterStyleSelector extends React.Component<
  FilterStyleSelectorProps,
  FilterStyleSelectorState
> {
  constructor(props: FilterStyleSelectorProps) {
    super(props);
    this.state = { selectedStyle: null };
  }

  render() {
    return (
      <div className="paletteContent stylePalette filterStyleSelector">
        <div className="stylePalette--header">
          <h2>Effects</h2>
        </div>
        <div className="stylePalette--content">
          {this.props.styles.map((style, idx) => (
            <img
              className={classNames('filterStyleSelector--filterStyle', {
                'is-selected': style === this.state.selectedStyle
              })}
              key={idx}
              src={style.tileImg}
              onClick={() => this.toggleSelectedStyle(style)}
            />
          ))}
        </div>
        <div className="stylePalette--footer">
          <button
            disabled={!this.props.isEnabled || !this.state.selectedStyle}
            onClick={() => this.props.onAddStyle(this.state.selectedStyle)}
          >
            Add Effect
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
