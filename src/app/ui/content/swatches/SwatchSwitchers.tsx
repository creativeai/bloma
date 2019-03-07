import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { FontSwatchSwitcher } from './FontSwatchSwitcher';
import { FilterSwatchSwitcher } from './FilterSwatchSwitcher';
import { ColorSwatchSwitcher } from './ColorSwatchSwitcher';
import { Styles, SizeFormat } from '../../../index';
import { clearPendingTransitions } from './swatchTransitions';

import './SwatchSwitchers.scss';

interface SwatchSwitchersProps {
  sizeFormats: SizeFormat[];
  textStyles: Styles[];
  textColors: Styles[];
  filterStyles: Styles[];
  activeSizeFormat: SizeFormat;
  activeTextStyle: Styles;
  activeTextColor: Styles;
  activeFilterStyle: Styles;
  onChangeActiveSizeFormat: (fmt: SizeFormat) => void;
  onChangeActiveTextStyle: (style: Styles) => void;
  onChangeActiveTextColor: (style: Styles) => void;
  onChangeActiveFilterStyle: (style: Styles) => void;
}

export class SwatchSwitchers extends React.Component<SwatchSwitchersProps> {
  render() {
    return (
      <div className="swatchSwitchers">
        <div className="formatSwatchSwitcher">
          {this.props.sizeFormats.map((sizeFormat, idx) => (
            <button
              key={idx}
              className={classNames(
                'styleSwatch formatSwatch formatSwatchSwitcher--swatch',
                {
                  'is-selected': _.isEqual(
                    sizeFormat,
                    this.props.activeSizeFormat
                  )
                }
              )}
              onClick={() => this.props.onChangeActiveSizeFormat(sizeFormat)}
            >
              <div
                className="formatSwatch--icon"
                style={{
                  width: 10,
                  height: (10 / sizeFormat.width) * sizeFormat.height
                }}
              />
              {/* {sizeFormat.category} {sizeFormat.name} */}
            </button>
          ))}
        </div>
        <div className="textGroupSwatchSwitcher">
          <FontSwatchSwitcher
            styles={this.props.textStyles}
            selectedStyle={this.props.activeTextStyle}
            retainElementsForTransition={false}
            transitionPreviousRetainedElements={true}
            onSelect={this.props.onChangeActiveTextStyle}
          />
          <ColorSwatchSwitcher
            styles={this.props.textColors}
            selectedStyle={this.props.activeTextColor}
            retainElementsForTransition={false}
            transitionPreviousRetainedElements={true}
            onSelect={this.props.onChangeActiveTextColor}
          />
        </div>
        <FilterSwatchSwitcher
          styles={this.props.filterStyles}
          selectedStyle={this.props.activeFilterStyle}
          retainElementsForTransition={false}
          transitionPreviousRetainedElements={true}
          onSelect={this.props.onChangeActiveFilterStyle}
        />
      </div>
    );
  }

  componentDidMount() {
    // Any transitioned swatches that are still there should be cleared now, as we have
    // rendered all swatches that will have adopted transitioned ones.
    clearPendingTransitions();
  }
}
