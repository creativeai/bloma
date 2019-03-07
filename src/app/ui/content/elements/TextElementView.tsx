import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { SizeFormat, TextElement, Alignment, Styles } from '../../../index';
import { setTextElement, drawTextElement } from '../../../helpers/elements';
import { buildGrid } from '../../../helpers/grid';
import { loadFont, loadFontsForStyles } from '../../../helpers/fonts';
import { DEFAULT_FONT_SIZES } from '../../../constants';
import { DEFAULT_FONT } from '../../../fonts';
import { FontSwatchSwitcher } from '../swatches/FontSwatchSwitcher';
import { ColorSwatchSwitcher } from '../swatches/ColorSwatchSwitcher';

import './TextElementView.scss';

interface TextElementViewProps {
  element: TextElement;
  styleOptions: Styles[];
  sizeConstraints: { width: number; height: number };
  isSelected: boolean;
  viewScale?: number;
  onSelect: () => void;
  onRemoveStyle: (style: Styles) => void;
}
interface TextElementViewState {
  selectedTextStyle: Styles;
  selectedTextColorStyle: Styles;
}

const DEFAULT_TEXT_STYLE: Styles = {
  name: 'Default',
  elementTypes: ['text'],
  text: {
    h1: {
      fontFamily: DEFAULT_FONT,
      fontSizes: DEFAULT_FONT_SIZES
    },
    h2: {
      fontFamily: DEFAULT_FONT,
      fontSizes: DEFAULT_FONT_SIZES
    }
  }
};
const DEFAULT_TEXT_COLOR_STYLE: Styles = {
  name: 'Default',
  elementTypes: ['text'],
  text: {
    h1: {
      textColors: ['#ffffff']
    },
    h2: {
      textColors: ['#ffffff']
    }
  }
};

export class TextElementView extends React.Component<
  TextElementViewProps,
  TextElementViewState
> {
  containerRef: React.RefObject<HTMLDivElement> = React.createRef();
  fontSwatchSwitcherRef: React.RefObject<
    FontSwatchSwitcher
  > = React.createRef();
  colorSwatchSwitcherRef: React.RefObject<
    ColorSwatchSwitcher
  > = React.createRef();

  constructor(props: TextElementViewProps) {
    super(props);
    this.state = {
      selectedTextStyle: _.first(this.getTextStyleOptions(props)),
      selectedTextColorStyle: _.first(this.getTextColorStyleOptions(props))
    };
  }

  componentDidMount() {
    this.renderTextLayer();
  }

  componentWillReceiveProps(newProps: TextElementViewProps) {
    let newTextStyles = _.difference(
      this.getTextStyleOptions(newProps),
      this.getTextStyleOptions(this.props)
    );
    let newTextColors = _.difference(
      this.getTextColorStyleOptions(newProps),
      this.getTextColorStyleOptions(this.props)
    );

    let newSelectedTextStyle: Styles;
    if (!_.includes(newProps.styleOptions, this.state.selectedTextStyle)) {
      newSelectedTextStyle = _.first(this.getTextStyleOptions(newProps));
    } else if (newTextStyles.length) {
      newSelectedTextStyle = _.first(newTextStyles);
    } else {
      newSelectedTextStyle = this.state.selectedTextStyle;
    }

    let newSelectedTextColorStyle: Styles;
    if (!_.includes(newProps.styleOptions, this.state.selectedTextColorStyle)) {
      newSelectedTextColorStyle = _.first(
        this.getTextColorStyleOptions(newProps)
      );
    } else if (newTextColors.length) {
      newSelectedTextColorStyle = _.first(newTextColors);
    } else {
      newSelectedTextColorStyle = this.state.selectedTextColorStyle;
    }

    if (
      !_.isEqual(newSelectedTextStyle, this.state.selectedTextStyle) ||
      !_.isEqual(
        newSelectedTextColorStyle,
        this.state.selectedTextColorStyle
      ) ||
      !_.isEqual(newProps.element, this.props.element)
    ) {
      this.setState(
        {
          selectedTextStyle: newSelectedTextStyle,
          selectedTextColorStyle: newSelectedTextColorStyle
        },
        () => this.renderTextLayer(newProps)
      );
    }
  }

  render() {
    return (
      <div
        className={classNames('textElementView', {
          'is-selected': this.props.isSelected
        })}
      >
        <div
          className="textElementView--textContainer"
          ref={this.containerRef}
        />
        <FontSwatchSwitcher
          elementStyle={{
            transform: `scale(${1 / (this.props.viewScale || 1)})`
          }}
          styles={this.getTextStyleOptions()}
          selectedStyle={this.state.selectedTextStyle}
          retainElementsForTransition={true}
          transitionPreviousRetainedElements={false}
          onSelect={style => this.onSelectTextStyle(style)}
          onRemove={style => this.props.onRemoveStyle(style)}
          ref={this.fontSwatchSwitcherRef}
        />
        <ColorSwatchSwitcher
          elementStyle={{
            transform: `scale(${1 / (this.props.viewScale || 1)})`
          }}
          styles={this.getTextColorStyleOptions()}
          selectedStyle={this.state.selectedTextColorStyle}
          retainElementsForTransition={true}
          transitionPreviousRetainedElements={false}
          onSelect={style => this.onSelectTextColorStyle(style)}
          onRemove={style => this.props.onRemoveStyle(style)}
          ref={this.colorSwatchSwitcherRef}
        />
      </div>
    );
  }

  renderTextLayer(props: TextElementViewProps = this.props) {
    let size: SizeFormat = this.createSizeFormat();
    let grid = buildGrid(size, false);
    let rect = { left: 0, top: 0, right: grid.columns, bottom: grid.rows };
    let alignment = { horizontal: 'left', vertical: 'middle' } as Alignment;
    let textStyle = this.state.selectedTextStyle || DEFAULT_TEXT_STYLE;
    let colorStyle =
      this.state.selectedTextColorStyle || DEFAULT_TEXT_COLOR_STYLE;
    loadFontsForStyles(textStyle.text).then(fonts => {
      drawTextElement(
        setTextElement({
          element: this.props.element,
          grid,
          size,
          textStyles: textStyle.text,
          textColorStyles: colorStyle.text,
          rect,
          extent: rect,
          alignment,
          fonts
        }),
        size,
        []
      ).then(canvas => {
        if (this.containerRef.current) {
          while (this.containerRef.current.firstChild) {
            this.containerRef.current.firstChild.remove();
          }
          this.containerRef.current.appendChild(canvas);
        }
      });
    });
  }

  createSizeFormat(): SizeFormat {
    return {
      category: 'Custom',
      name: 'Custom',
      width: this.props.sizeConstraints.width,
      height: this.props.sizeConstraints.height,
      renderWidth: this.props.sizeConstraints.width * 2,
      renderHeight: this.props.sizeConstraints.height * 2
    };
  }

  onSelectTextStyle(style: Styles) {
    this.props.onSelect();
    this.setState({ selectedTextStyle: style }, () => this.renderTextLayer());
  }

  onSelectTextColorStyle(style: Styles) {
    this.props.onSelect();
    this.setState({ selectedTextColorStyle: style }, () =>
      this.renderTextLayer()
    );
  }

  getTextStyleOptions(props: TextElementViewProps = this.props) {
    return props.styleOptions.filter(styles => styles.text.h1.fontFamily);
  }

  getTextColorStyleOptions(props: TextElementViewProps = this.props) {
    return props.styleOptions.filter(
      styles => styles.text.h1.textColors || styles.text.h1.textMaskUrl
    );
  }

  onPanelExit() {
    this.fontSwatchSwitcherRef.current.onPanelExit();
    this.colorSwatchSwitcherRef.current.onPanelExit();
  }
}
