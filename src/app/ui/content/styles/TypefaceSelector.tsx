import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { FontStyles } from './FontStyles';
import { Styles, ElementType } from '../../../index';
import { FONTS, Font } from '../../../fonts';

import './TypefaceSelector.scss';

interface TypefaceSelectorProps {
  isEnabled: boolean;
  onAddStyle: (style: Styles) => void;
}
interface TypefaceSelectorState {
  searchKeyword: string;
  selectedTextStyle: Styles;
}

const ALL_FONT_STYLES = FONTS.map(font => ({
  name: font.key,
  elementTypes: ['text' as ElementType],
  text: {
    h1: {
      fontFamily: font.key
    },
    h2: { fontFamily: font.key }
  },
  fullName: `${font.familyName || ''} ${font.subFamilyName || ''}`.toLowerCase()
}));

export class TypefaceSelector extends React.Component<
  TypefaceSelectorProps,
  TypefaceSelectorState
> {
  constructor(props: TypefaceSelectorProps) {
    super(props);
    this.state = { searchKeyword: '', selectedTextStyle: null };
  }

  render() {
    return (
      <div className="typefaceSelector">
        <FontStyles
          fonts={ALL_FONT_STYLES.map(s => this.getFont(s.text.h1.fontFamily))}
        />
        <div className="typefaceSelector--searchInputGroup">
          <input
            type="text"
            className="typefaceSelector--searchInput"
            placeholder="Search fonts by name"
            value={this.state.searchKeyword}
            onChange={evt => this.setState({ searchKeyword: evt.target.value })}
          />
        </div>
        <div className="typefaceSelector--typefaceList">
          {this.getFontStyles().map((style, idx) =>
            this.renderTextStyle(style, idx)
          )}
        </div>
        <button
          className="typefaceSelector--addButton"
          disabled={!this.props.isEnabled || !this.state.selectedTextStyle}
          onClick={() => this.props.onAddStyle(this.state.selectedTextStyle)}
        >
          Add Font
        </button>
      </div>
    );
  }

  getFontStyles() {
    if (_.isEmpty(this.state.searchKeyword.trim())) {
      return ALL_FONT_STYLES;
    } else {
      let kw = this.state.searchKeyword.trim().toLowerCase();
      return ALL_FONT_STYLES.filter(s => s.fullName.indexOf(kw) >= 0);
    }
  }

  renderTextStyle(textStyle: Styles, idx: number) {
    let font = this.getFont(textStyle.text.h1.fontFamily);
    let familyName = font.familyName || '';
    let subFamilyName = font.subFamilyName || '';
    let fullName = `${font.familyName} ${font.subFamilyName}`.toLowerCase();
    let familyNamePreKeyword = '',
      familyNameKeyword = '',
      familyNamePostKeyword = '',
      subFamilyNamePreKeyword = '',
      subFamilyNameKeyword = '',
      subFamilyNamePostKeyword = '';
    if (!_.isEmpty(this.state.searchKeyword)) {
      let kwStartIndex = fullName.indexOf(
        this.state.searchKeyword.trim().toLowerCase()
      );
      let kwEndIndex = kwStartIndex + this.state.searchKeyword.length;
      if (kwStartIndex < font.familyName.length) {
        familyNamePreKeyword = familyName.substring(0, kwStartIndex);
        familyNameKeyword = familyName.substring(
          kwStartIndex,
          Math.min(kwEndIndex, familyName.length)
        );
        familyNamePostKeyword = familyName.substring(
          Math.min(kwEndIndex, familyName.length)
        );
      } else {
        familyNamePreKeyword = familyName;
      }
      if (kwEndIndex > font.familyName.length) {
        kwStartIndex -= familyName.length + 1;
        kwEndIndex -= familyName.length + 1;
        subFamilyNamePreKeyword = subFamilyName.substring(
          Math.max(0, kwStartIndex),
          Math.max(0, kwStartIndex)
        );
        subFamilyNameKeyword = subFamilyName.substring(
          Math.max(0, kwStartIndex),
          kwEndIndex
        );
        subFamilyNamePostKeyword = subFamilyName.substring(kwEndIndex);
      } else {
        subFamilyNamePostKeyword = subFamilyName;
      }
    } else {
      familyNamePreKeyword = font.familyName;
      subFamilyNamePreKeyword = font.subFamilyName;
    }
    return (
      <div
        key={idx}
        className={classNames('typefaceSelector--typeface', {
          'is-selected': textStyle === this.state.selectedTextStyle
        })}
        style={{ fontFamily: font.key }}
        onClick={() => this.toggleSelectedStyle(textStyle)}
      >
        {familyNamePreKeyword}
        <span className="typefaceSelector--searchHighlight">
          {familyNameKeyword}
        </span>
        {familyNamePostKeyword}{' '}
        <span className="typefaceSelector--typeface--subFamily">
          {subFamilyNamePreKeyword}
          <span className="typefaceSelector--searchHighlight">
            {subFamilyNameKeyword}
          </span>
          {subFamilyNamePostKeyword}
        </span>
      </div>
    );
  }

  getFont(fontFamily: string): Font {
    return _.find(FONTS, { key: fontFamily }) as Font;
  }

  toggleSelectedStyle(textStyle: Styles) {
    this.setState({
      selectedTextStyle:
        this.state.selectedTextStyle === textStyle ? null : textStyle
    });
  }
}
