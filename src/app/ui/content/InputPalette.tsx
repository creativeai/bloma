import * as React from 'react';
import * as _ from 'lodash';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { PanelProps } from './PanelProps';
import {
  Element,
  Styles,
  ElementType,
  CSSColor,
  DetectedObject,
  StyleBundle,
  TextContent
} from '../../index';
import { getStyles, findInFrames } from '../../helpers/frames';
import { TextStyleSelector } from './TextStyleSelector';
import { FilterStyleSelector } from './styles/FilterStyleSelector';

import { HierarchySelector } from './HierarchySelector';
import { TextSelector } from './TextSelector';
import { ForegroundSelector, ForegroundContent } from './ForegroundSelector';

import { BackgroundInputSelector } from './BackgroundInputSelector';
import { BackgroundImageContent } from './BackgroundImageSelector';

import './InputPalette.scss';
import {
  addBackgroundColorFrame,
  addBackgroundImageFrame,
  updateObjectsInBackgroundImageFrame,
  updateHighlightedObjectInBackgroundImageFrame,
  updateSelectedObjectInBackgroundImageFrame,
  addForegroundFrame,
  addStyleFrame,
  addHierarchyFrame,
  updateTextFrame,
  removeStyleFrame,
  addStyleBundleFrames
} from './InputOperations';
import { InputPanelStage } from './InputPanel';
import { StyleBundleSelector } from './StyleBundleSelector';
import { isEmpty } from '../../helpers/text';

export interface InputPaletteProps extends PanelProps {
  stage: InputPanelStage;
  onSetActionState: (key: string, value: any) => void;
}
interface InputPaletteState {}

const MAX_STYLES_PER_TYPE = 3;

export class InputPalette extends React.Component<
  InputPaletteProps,
  InputPaletteState
> {
  constructor(props: InputPaletteProps) {
    super(props);
  }

  componentWillMount() {
    if (this.isDirectlyProceedableStage()) {
      this.allowProceed();
    }
  }

  componentWillReceiveProps(newProps: InputPaletteProps) {
    if (this.isDirectlyProceedableStage(newProps)) {
      this.allowProceed(newProps);
    }
  }

  isDirectlyProceedableStage(props: InputPaletteProps = this.props) {
    return (
      props.stage === 'foreground' ||
      props.stage === 'hierarchy' ||
      props.stage === 'styleBundle' ||
      props.stage === 'textStyle' ||
      props.stage === 'filterStyle' ||
      props.stage === 'customiseStyles'
    );
  }

  allowProceed(props: InputPaletteProps = this.props) {
    for (let i = 0; i < props.action.items.length; i++) {
      if (!_.includes(props.action.selectedIndexes, i)) {
        this.props.onToggleSelectItem(i, true);
      }
    }
  }

  disallowProceed(props: InputPaletteProps = this.props) {
    for (let i = 0; i < props.action.items.length; i++) {
      this.props.onToggleSelectItem(i, false);
    }
  }

  render() {
    return (
      <TransitionGroup component={null}>
        {this.renderCurrentSelector()}
      </TransitionGroup>
    );
  }

  renderCurrentSelector() {
    let item = _.first(this.props.action.items);
    if (item && this.props.stage === 'background') {
      return this.wrapSelectorTransition(
        'background',
        <BackgroundInputSelector
          action={this.props.action}
          item={item}
          onColorChange={t => this.addBackgroundColorFrame(t)}
          onImageChange={t => this.addBackgroundImageFrame(t)}
          onObjectsChange={o => this.updateObjectsInBackgroundImageFrame(o)}
          onHighlightedObjectChange={o =>
            this.updateHighlightedObjectInBackgroundImageFrame(o)
          }
          onSelectedObjectChange={o =>
            this.updateSelectedObjectInBackgroundImageFrame(o)
          }
          onSetActionState={this.props.onSetActionState}
          onProceed={this.props.onProceed}
        />
      );
    } else if (item && this.props.stage === 'foreground') {
      return this.wrapSelectorTransition(
        'foreground',
        <ForegroundSelector
          key="background"
          item={item}
          onForegroundChange={t => this.addForegroundFrame(t)}
        />
      );
    }
    if (item && this.props.stage === 'text') {
      return this.wrapSelectorTransition(
        'text',
        <TextSelector
          key="text"
          item={item}
          onTextChanged={this.updateTextFrame}
        />
      );
    } else if (item && this.props.stage === 'hierarchy') {
      return this.wrapSelectorTransition(
        'hierachy',
        <HierarchySelector
          key="hierarchy"
          item={item}
          onHierarchyChanged={h => this.addHierarchyFrame(h)}
          onProceed={this.props.onProceed}
          onHover={(el, on) => {
            if (on) {
              this.props.onSetActionState('selectedElement', el);
            } else if (this.props.action.state.selectedElement === el) {
              this.props.onSetActionState('selectedElement', null);
            }
          }}
        />
      );
    } else if (item && this.props.stage === 'styleBundle') {
      return this.wrapSelectorTransition(
        'hierachy',
        <StyleBundleSelector
          key="styleBundle"
          allStyleBundles={this.getStyleBundleOptions()}
          onStyleBundleChange={bundle => this.addStyleBundleFrames(bundle)}
        />
      );
    }

    let elements = this.getRenderedElements();
    for (let el of elements) {
      let SelectorComponent = this.getSelectorComponent(el.type);
      if (
        SelectorComponent &&
        this.props.action.state.selectedElement &&
        this.props.action.state.selectedElement.type === el.type
      ) {
        return (
          <SelectorComponent
            action={this.props.action}
            styles={this.getStyleOptions(el)}
            isEnabled={this.getStyles(el.type).length < MAX_STYLES_PER_TYPE}
            onAddStyle={styles => this.addStyleFrame(styles)}
            onSetActionState={this.props.onSetActionState}
          />
        );
      }
    }

    return null;
  }

  wrapSelectorTransition(key: string, content: JSX.Element) {
    return (
      <CSSTransition
        classNames="paletteContent"
        key={key}
        timeout={{ enter: 1600, exit: 300 }}
      >
        {content}
      </CSSTransition>
    );
  }

  getStyleOptions(element: Element) {
    let item = _.first(this.props.action.items);
    let allStyleOptions: Styles[] = [];
    for (let frame of item.frames) {
      if (frame.metadata && frame.metadata.allStyles) {
        allStyleOptions = allStyleOptions.concat(frame.metadata.allStyles);
      }
    }
    return allStyleOptions.filter(s =>
      _.includes(s.elementTypes, element.type)
    );
  }

  getStyleBundleOptions() {
    return findInFrames(
      _.first(this.props.action.items),
      'metadata.allStyleBundles'
    ) as StyleBundle[];
  }

  getSelectorComponent(elementType: ElementType) {
    switch (elementType) {
      case 'text':
        return TextStyleSelector;
      case 'background_image':
        return FilterStyleSelector;
      default:
        return null;
    }
  }

  getStyles(type: ElementType) {
    return getStyles(_.first(this.props.action.items), type);
  }

  getRenderedElements(props: InputPaletteProps = this.props) {
    let result: Element[] = [];
    let item = _.first(props.action.items);
    if (item) {
      for (let frame of item.frames) {
        result = result.concat(frame.elements || []);
      }
    }
    return result.filter(el => this.isRenderedElement(el));
  }

  isRenderedElement(el: Element) {
    if (el.type === 'text') {
      return !_.isEmpty(el.content);
    } else {
      return true;
    }
  }

  addBackgroundColorFrame(color: CSSColor) {
    addBackgroundColorFrame(color, this.props);
    this.allowProceed();
  }

  addBackgroundImageFrame(content: BackgroundImageContent) {
    addBackgroundImageFrame(content, this.props);
    this.disallowProceed();
  }

  updateObjectsInBackgroundImageFrame(objects: DetectedObject[]) {
    updateObjectsInBackgroundImageFrame(objects, this.props);
    if (objects.length === 0) {
      this.allowProceed();
    }
  }

  updateHighlightedObjectInBackgroundImageFrame(index: number) {
    updateHighlightedObjectInBackgroundImageFrame(index, this.props);
  }

  updateSelectedObjectInBackgroundImageFrame(index: number) {
    let isSelected = updateSelectedObjectInBackgroundImageFrame(
      index,
      this.props
    );
    isSelected ? this.allowProceed() : this.disallowProceed();
  }

  addForegroundFrame(content: ForegroundContent) {
    addForegroundFrame(content, this.props);
  }

  addStyleFrame(styles: Styles) {
    addStyleFrame(styles, this.props);
  }

  addStyleBundleFrames(bundle: StyleBundle) {
    addStyleBundleFrames(bundle, this.props);
    this.allowProceed();
  }

  addHierarchyFrame(hierarchy: string[]) {
    addHierarchyFrame(hierarchy, this.props);
  }

  updateTextFrame = (newText: TextContent[]) => {
    updateTextFrame(newText, this.props);
    if (isEmpty(newText)) {
      this.disallowProceed();
    } else {
      this.allowProceed();
    }
  };

  removeStyleFrame(styles: Styles) {
    removeStyleFrame(styles, this.props);
  }
}
