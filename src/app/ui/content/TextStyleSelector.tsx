import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { TypefaceSelector } from './styles/TypefaceSelector';
import { ColorStyleSelector } from './styles/ColorStyleSelector';
import { Styles, Action } from '../../index';

import './TextStyleSelector.scss';

interface TextStyleSelectorProps {
  action: Action;
  styles: Styles[];
  isEnabled: boolean;
  onAddStyle: (style: Styles) => void;
  onSetActionState: (key: string, value: any) => void;
}
export class TextStyleSelector extends React.Component<TextStyleSelectorProps> {
  constructor(props: TextStyleSelectorProps) {
    super(props);
  }

  componentWillMount() {
    this.activateTypefaceCategory();
  }

  render() {
    return (
      <div className="paletteContent textStyleSelector">
        {this.renderTabs()}
        <div className="textStyleSelector--content">{this.renderInput()}</div>
      </div>
    );
  }

  renderTabs() {
    return (
      <div className="paletteTabs textStyleSelector--tabs">
        <button
          className={classNames(
            'paletteTabs--tab textStyleSelector--tab',
            'typeface',
            {
              'is-active': this.props.action.state.activeCategory === 'typeface'
            }
          )}
          onClick={() => this.activateTypefaceCategory()}
        >
          Fonts
        </button>
        <button
          className={classNames(
            'paletteTabs--tab textStyleSelector--tab',
            'color',
            {
              'is-active': this.props.action.state.activeCategory === 'color'
            }
          )}
          onClick={() => this.activateColorCategory()}
        >
          Colors
        </button>
      </div>
    );
  }

  renderInput() {
    switch (this.props.action.state.activeCategory) {
      case 'typeface':
        return this.renderTypefaceInput();
      case 'color':
        return this.renderColorInput();
    }
  }

  renderTypefaceInput(): JSX.Element {
    return (
      <TypefaceSelector
        isEnabled={true}
        onAddStyle={styles => this.props.onAddStyle(styles)}
      />
    );
  }

  renderColorInput() {
    return (
      <ColorStyleSelector
        styles={this.props.styles.filter(
          s => s.text.h1.textColors || s.text.h1.textMaskUrl
        )}
        isEnabled={true}
        onAddStyle={styles => this.props.onAddStyle(styles)}
      />
    );
  }

  activateTypefaceCategory() {
    this.props.onSetActionState('activeCategory', 'typeface');
  }

  activateColorCategory() {
    this.props.onSetActionState('activeCategory', 'color');
  }
}
