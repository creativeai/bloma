import * as React from 'react';
import classNames from 'classnames';
import * as update from 'immutability-helper';
import EventListener from 'react-event-listener';
import * as _ from 'lodash';
import { CSSTransition } from 'react-transition-group';

import { PanelProps } from './PanelProps';
import {
  Element,
  Styles,
  ElementType,
  ItemFrame,
  Item,
  BackgroundImageElement
} from '../../index';
import { TextElementView } from './elements/TextElementView';
import { ImageElementView } from './elements/ImageElementView';
import { getStyles } from '../../helpers/frames';
import { ColorElementView } from './elements/ColorElementView';
import {
  updateHighlightedObjectInBackgroundImageFrame,
  updateSelectedObjectInBackgroundImageFrame,
  updateObjectInBackgroundImageFrame
} from './InputOperations';
import { getElementsInHierarchyOrder } from '../../helpers/hierarchy';
import { loadImageDOM } from '../../helpers/images';

import bgPlaceholderUrl from '../../../assets/background-image-placeholder.svg';

import './InputPanel.scss';

export type InputPanelStage =
  | 'background'
  | 'foreground'
  | 'text'
  | 'hierarchy'
  | 'styleBundle'
  | 'textStyle'
  | 'filterStyle'
  | 'customiseStyles';
export interface InputPanelProps extends PanelProps {
  stage: InputPanelStage;
  onSetActionState: (key: string, value: any) => void;
}
interface InputPanelState {
  enteredElements: { [elementId: string]: boolean };
}

const STAGGER_MS = 100;
const FOREGROUND_IMAGE_ASPECT_RATIO = 1;
const TEXT_ASPECT_RATIO = 420 / 270;
const BACKGROUND_COLOR_ASPECT_RATIO = 1;

const BACKGROUND_PLACEHOLDER_ELEMENT: BackgroundImageElement = {
  id: 'placeholder',
  type: 'background_image',
  image: null,
  originalSize: { width: 0, height: 0 }
};
loadImageDOM(bgPlaceholderUrl).then(img => {
  BACKGROUND_PLACEHOLDER_ELEMENT.image = img;
  BACKGROUND_PLACEHOLDER_ELEMENT.originalSize.width = img.width;
  BACKGROUND_PLACEHOLDER_ELEMENT.originalSize.height = img.height;
});

export class InputPanel extends React.Component<
  InputPanelProps,
  InputPanelState
> {
  private elementViewRefs = new Map<
    ElementType,
    TextElementView | ImageElementView
  >();

  constructor(props: InputPanelProps) {
    super(props);
    this.state = {
      enteredElements: {}
    };
  }

  componentWillMount() {
    let elements = this.getRenderedElements();
    this.staggerIn(elements.map(e => e.element));
  }

  componentWillReceiveProps(newProps: InputPanelProps) {
    if (newProps.stage !== this.props.stage) {
      let elements = this.getRenderedElements();
      let item = _.first(newProps.action.items);
      let hasStylesFromBundle =
        item &&
        item.frames.filter(f => _.has(f, 'metadata.fromStyleBundle')).length >
          0;
      if (newProps.stage === 'textStyle') {
        if (hasStylesFromBundle) {
          this.props.onProceed();
        } else {
          let textElement = _.find(elements, e => e.element.type === 'text');
          this.props.onSetActionState('selectedElement', textElement.element);
        }
      } else if (newProps.stage === 'filterStyle') {
        if (hasStylesFromBundle) {
          this.props.onProceed();
        } else {
          let bgElement = _.find(
            elements,
            e => e.element.type === 'background_image'
          );
          if (bgElement) {
            this.props.onSetActionState('selectedElement', bgElement.element);
          } else {
            this.props.onProceed();
          }
        }
      } else if (newProps.stage === 'customiseStyles') {
        if (hasStylesFromBundle) {
          console.log('customise... selecting none.');
          this.props.onSetActionState('selectedElement', null);
        } else {
          this.props.onProceed();
        }
      }
    }
    this.staggerIn(
      _.difference(
        this.getRenderedElements(newProps),
        this.getRenderedElements()
      ).map(e => e.element)
    );
  }

  staggerIn(elements: Element[]) {
    for (let i = 0; i < elements.length; i++) {
      setTimeout(
        () =>
          this.setState({
            enteredElements: update(this.state.enteredElements, {
              [elements[i].id]: { $set: true }
            })
          }),
        STAGGER_MS * (i + 1)
      );
    }
  }

  render() {
    return (
      <div
        className={classNames(
          'panel',
          'inputPanel',
          `stage-${this.props.stage}`
        )}
      >
        <EventListener target="window" onResize={() => this.setState({})} />
        {this.renderElements()}
      </div>
    );
  }

  renderElements() {
    let elements = this.getRenderedElements();
    let textElement = _.find(elements, e => e.element.type === 'text');
    let bgElement = _.find(
      elements,
      el =>
        el.element.type === 'background_color' ||
        el.element.type === 'background_image'
    ) || { item: null, frame: null, element: BACKGROUND_PLACEHOLDER_ELEMENT };
    let fgElement = _.find(
      elements,
      e => e.element.type === 'foreground_image'
    );

    let surfaceWidth = Math.min(770, window.innerWidth),
      windowHeight = window.innerHeight,
      bgAspectRatio =
        bgElement && bgElement.element.type === 'background_image'
          ? bgElement.element.originalSize.width /
            bgElement.element.originalSize.height
          : 1,
      elementRenderWidth = 800,
      textScale = 1,
      textTranslateX = 0,
      textTranslateY = 0,
      backgroundScale = 1,
      backgroundTranslateX = 0,
      backgroundTranslateY = 0,
      foregroundScale = 1,
      foregroundTranslateX = 0,
      foregroundTranslateY = 0;

    textScale = (surfaceWidth * 0.52) / elementRenderWidth;

    if (textElement) {
      foregroundTranslateY =
        (elementRenderWidth / TEXT_ASPECT_RATIO) * textScale + 80;
      foregroundScale = (surfaceWidth * 0.28) / elementRenderWidth;
      foregroundTranslateX = surfaceWidth * 0.1;
    } else {
      foregroundScale = (surfaceWidth * 0.38) / elementRenderWidth;
      foregroundTranslateX = surfaceWidth * 0.1;
    }
    if (textElement) {
      let bgScaleRatio = bgAspectRatio > 1 ? 0.7 : 0.52;
      backgroundTranslateX = surfaceWidth * 0.48;
      backgroundTranslateY = windowHeight * 0.2;
      backgroundScale = (surfaceWidth * bgScaleRatio) / elementRenderWidth;
    } else if (fgElement) {
      let bgScaleRatio = bgAspectRatio > 1 ? 0.8 : 0.5;
      backgroundTranslateX = surfaceWidth * 0.4;
      backgroundTranslateY = windowHeight * 0.2;
      backgroundScale = (surfaceWidth * bgScaleRatio) / elementRenderWidth;
    } else {
      let bgScaleRatio = bgAspectRatio > 1 ? 0.9 : 0.6;
      backgroundTranslateX = surfaceWidth * 0.25;
      backgroundTranslateY = windowHeight * 0.1;
      backgroundScale = (surfaceWidth * bgScaleRatio) / elementRenderWidth;
    }

    return (
      <div
        className="inputPanel--elements"
        onClick={evt =>
          evt.target === evt.currentTarget &&
          this.props.stage === 'customiseStyles' &&
          this.toggleSelectedElement(null)
        }
      >
        {textElement &&
          this.renderElementView(
            textElement.element,
            textElement.frame,
            textElement.item,
            elementRenderWidth,
            [textTranslateX, textTranslateY],
            textScale
          )}
        {bgElement &&
          this.renderElementView(
            bgElement.element,
            bgElement.frame,
            bgElement.item,
            elementRenderWidth,
            [backgroundTranslateX, backgroundTranslateY],
            backgroundScale
          )}
        {fgElement &&
          this.renderElementView(
            fgElement.element,
            fgElement.frame,
            fgElement.item,
            elementRenderWidth,
            [foregroundTranslateX, foregroundTranslateY],
            foregroundScale
          )}
      </div>
    );
  }

  renderElementView(
    element: Element,
    frame: ItemFrame,
    item: Item,
    elementRenderWidth: number,
    position: [number, number],
    scale: number
  ) {
    let isSelected = element === this.props.action.state.selectedElement;
    let isEntered =
      element.id === 'placeholder'
        ? true
        : this.state.enteredElements[element.id];
    let elementView;
    switch (element.type) {
      case 'text':
        elementView = (
          <TextElementView
            element={element}
            styleOptions={this.getStyles(element.type)}
            sizeConstraints={{
              width: elementRenderWidth,
              height: elementRenderWidth / TEXT_ASPECT_RATIO
            }}
            isSelected={isSelected}
            viewScale={scale}
            onSelect={() =>
              this.props.stage === 'customiseStyles' &&
              this.toggleSelectedElement(element, true)
            }
            onRemoveStyle={this.removeStyleFrame}
            ref={cmp => this.elementViewRefs.set(element.type, cmp)}
          />
        );
        break;
      case 'background_image':
      case 'foreground_image':
        elementView = (
          <ImageElementView
            stage={this.props.stage}
            element={element}
            frame={frame}
            item={item}
            action={this.props.action}
            styleOptions={this.getStyles(element.type)}
            sizeConstraints={{ width: elementRenderWidth }}
            isSelected={isSelected}
            viewScale={scale}
            onSelect={() =>
              this.props.stage === 'customiseStyles' &&
              this.toggleSelectedElement(element, true)
            }
            onHighlightedObjectChange={index =>
              updateHighlightedObjectInBackgroundImageFrame(index, this.props)
            }
            onSelectedObjectChange={index => {
              let isSelected = updateSelectedObjectInBackgroundImageFrame(
                index,
                this.props
              );
              isSelected ? this.allowProceed() : this.disallowProceed();
            }}
            onObjectUpdate={(index, updatedObject) =>
              updateObjectInBackgroundImageFrame(
                index,
                updatedObject,
                this.props
              )
            }
            onRemoveStyle={styles => this.removeStyleFrame(styles)}
            ref={cmp => this.elementViewRefs.set(element.type, cmp)}
          />
        );
        break;
      case 'background_color':
        elementView = (
          <ColorElementView element={element} isSelected={isSelected} />
        );
        break;
    }
    return (
      <CSSTransition
        in={isEntered}
        classNames="inputPanel--element"
        timeout={5000}
        appear
      >
        <div
          className={classNames('inputPanel--element', element.type, {
            'is-selected': isSelected,
            'is-entered': isEntered
          })}
          style={{
            transform: `translate(${position[0]}px, ${position[1]}px)`,
            ...this.getElementSizeStyle(element, elementRenderWidth)
          }}
        >
          <div
            className="inputPanel--elementContent"
            style={{ transform: `scale(${scale})` }}
            data-element-id={element.id}
            onClick={() =>
              this.props.stage === 'customiseStyles' &&
              this.toggleSelectedElement(element)
            }
          >
            {elementView}
          </div>
          {this.props.stage === 'hierarchy' && (
            <div
              className="hierarchyCounter"
              style={{
                transform: `translate(-${elementRenderWidth * (1 - scale)}px)`
              }}
            >
              {this.getHierarchyPosition(element, item)}
            </div>
          )}
        </div>
      </CSSTransition>
    );
  }

  toggleSelectedElement(element: Element, force = false) {
    let selected =
      this.props.action.state.selectedElement !== element || force
        ? element
        : null;
    this.props.onSetActionState('selectedElement', selected);
  }

  allowProceed(props: InputPanelProps = this.props) {
    for (let i = 0; i < props.action.items.length; i++) {
      if (!_.includes(props.action.selectedIndexes, i)) {
        this.props.onToggleSelectItem(i, true);
      }
    }
  }

  disallowProceed(props: InputPanelProps = this.props) {
    for (let i = 0; i < props.action.items.length; i++) {
      this.props.onToggleSelectItem(i, false);
    }
  }

  getElementSizeStyle(element: Element, elementRenderWidth: number) {
    let aspectRatio = 1;
    switch (element.type) {
      case 'background_color':
        aspectRatio = BACKGROUND_COLOR_ASPECT_RATIO;
        break;
      case 'foreground_image':
        aspectRatio = FOREGROUND_IMAGE_ASPECT_RATIO;
        break;
      case 'text':
        aspectRatio = TEXT_ASPECT_RATIO;
        break;
      case 'background_image':
        aspectRatio = element.originalSize.width / element.originalSize.height;
    }
    let width = elementRenderWidth;
    let height = width / aspectRatio;
    return { width, height };
  }

  getHierarchyPosition(element: Element, item: Item) {
    let elements = getElementsInHierarchyOrder(item);
    return elements.indexOf(element) + 1;
  }

  getStyles(type: ElementType) {
    let item = _.first(this.props.action.items);
    if (item) {
      return getStyles(item, type);
    } else {
      return [];
    }
  }

  getRenderedElements(props: InputPanelProps = this.props) {
    let result: { element: Element; frame: ItemFrame; item: Item }[] = [];
    let item = _.first(props.action.items);
    if (item) {
      for (let frame of item.frames) {
        let els = (frame.elements || []).map(element => ({
          element,
          frame,
          item
        }));
        result = result.concat(els);
      }
    }
    return result.filter(el => this.isRenderedElement(el.element));
  }

  isRenderedElement(el: Element) {
    if (el.type === 'text') {
      return !_.isEmpty(el.content);
    } else {
      return true;
    }
  }

  removeStyleFrame = (styles: Styles) => {
    for (let i = 0; i < this.props.action.items.length; i++) {
      let item = this.props.action.items[i];
      let frames = item.frames.filter(
        f => !_.isEqual(_.get(f, 'metadata.style'), styles)
      );
      this.props.onUpdateItem(i, update(item, { frames: { $set: frames } }));
    }
  };

  onPanelExit() {
    for (let elView of Array.from(this.elementViewRefs.values())) {
      elView && elView.onPanelExit();
    }
  }
}
