import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import {
  BackgroundImageElement,
  Styles,
  ForegroundImageElement,
  ImageSize,
  ItemFrame,
  Item,
  DetectedObject,
  Action
} from '../../../index';
import { doStyleImage } from '../../../transforms/style_image';
import { imgToCanvas } from '../../../helpers/images';
import { FilterSwatchSwitcher } from '../swatches/FilterSwatchSwitcher';
import {
  DetectedObjects,
  DetectedObjectInteractionCommand
} from '../../frame_visualizations/DetectedObjects';

import './ImageElementView.scss';
import { findInFrames } from '../../../helpers/frames';
import { InputPanelStage } from '../InputPanel';

interface ImageElementViewProps {
  stage: InputPanelStage;
  element: BackgroundImageElement | ForegroundImageElement;
  frame: ItemFrame;
  item: Item;
  action: Action;
  styleOptions: Styles[];
  sizeConstraints: { width: number };
  viewScale?: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemoveStyle: (style: Styles) => void;
  onHighlightedObjectChange?: (index: number) => void;
  onSelectedObjectChange?: (index: number) => void;
  onObjectUpdate?: (index: number, updatedObject: DetectedObject) => void;
}
interface ImageElementViewState {
  selectedStyles: Styles;
}

export class ImageElementView extends React.Component<
  ImageElementViewProps,
  ImageElementViewState
> {
  containerRef: React.RefObject<HTMLDivElement> = React.createRef();
  filterSwatchSwitcherRef: React.RefObject<
    FilterSwatchSwitcher
  > = React.createRef();

  constructor(props: ImageElementViewProps) {
    super(props);
    this.state = { selectedStyles: _.first(this.props.styleOptions) };
  }

  componentDidMount() {
    this.renderImageLayer();
  }

  componentWillReceiveProps(newProps: ImageElementViewProps) {
    if (!_.includes(newProps.styleOptions, this.state.selectedStyles)) {
      this.setState({ selectedStyles: _.first(newProps.styleOptions) }, () =>
        this.renderImageLayer(newProps)
      );
    } else {
      let newStyles = _.difference(
        newProps.styleOptions,
        this.props.styleOptions
      );
      if (newStyles.length) {
        this.setState({ selectedStyles: _.first(newStyles) }, () =>
          this.renderImageLayer(newProps)
        );
      }
    }
  }

  render() {
    return (
      <div
        className={classNames('imageElementView', this.props.element.type, {
          'is-selected': this.props.isSelected
        })}
      >
        <div
          className="imageElementView--imageContainer"
          ref={this.containerRef}
        >
          {this.props.stage === 'background' &&
            this.props.item &&
            (this.props.action.state.detecting || this.hasObjects()) && (
              <DetectedObjects
                all
                frame={this.props.frame}
                item={this.props.item}
                position={{ left: 0, right: 0, width: '100%', height: '100%' }}
                onInteract={(cmd, object, idx) =>
                  this.onObjectInteraction(cmd, object, idx)
                }
              />
            )}
        </div>
        <FilterSwatchSwitcher
          styles={this.props.styleOptions}
          selectedStyle={this.state.selectedStyles}
          retainElementsForTransition={true}
          transitionPreviousRetainedElements={false}
          elementStyle={{
            transform: `scale(${1 / (this.props.viewScale || 1)})`
          }}
          onSelect={this.onSelectStyles}
          onRemove={this.props.onRemoveStyle}
          ref={this.filterSwatchSwitcherRef}
        />
      </div>
    );
  }

  hasObjects() {
    return !!findInFrames(this.props.item, 'metadata.allObjects');
  }

  renderImageLayer(props: ImageElementViewProps = this.props) {
    while (this.containerRef.current.querySelector('canvas')) {
      this.containerRef.current.querySelector('canvas').remove();
    }
    let canvasPromise: Promise<HTMLCanvasElement>;
    if (this.state.selectedStyles) {
      canvasPromise = doStyleImage(
        this.props.element,
        this.state.selectedStyles,
        this.getRenderImageSize()
      );
    } else {
      canvasPromise = Promise.resolve(
        imgToCanvas(this.props.element, this.getRenderImageSize())
      );
    }
    canvasPromise.then(imageCanvas =>
      this.containerRef.current.insertBefore(
        imageCanvas,
        this.containerRef.current.firstChild
      )
    );
  }

  getRenderImageSize(): ImageSize {
    let width = this.props.sizeConstraints.width * 2;
    let height =
      (width / this.props.element.originalSize.width) *
      this.props.element.originalSize.height;
    return { width, height };
  }

  onSelectStyles = (styles: Styles) => {
    this.props.onSelect();
    this.setState({ selectedStyles: styles }, () => this.renderImageLayer());
  };

  onObjectInteraction(
    interaction: DetectedObjectInteractionCommand,
    object: DetectedObject,
    index: number
  ) {
    if (interaction === 'highlightIn') {
      this.highlightObjectIn(index);
    } else if (interaction === 'highlightOut') {
      this.highlightObjectOut(index);
    } else if (interaction === 'toggleSelection') {
      this.toggleObjectSelection(index);
    } else if (interaction === 'resize' || interaction === 'moveFocalPoint') {
      this.props.onObjectUpdate(index, object);
    }
  }

  highlightObjectIn(idx: number) {
    this.props.onHighlightedObjectChange(idx);
  }

  highlightObjectOut(idx: number) {
    if (this.isObjectHighlighted(idx)) {
      this.props.onHighlightedObjectChange(null);
    }
  }

  toggleObjectSelection(idx: number) {
    if (this.isObjectSelected(idx)) {
      this.props.onSelectedObjectChange(null);
    } else {
      this.props.onSelectedObjectChange(idx);
    }
  }

  isObjectSelected(idx: number) {
    let allObjects = this.getObjects();
    let selectedObjects = this.getSelectedObjects();
    return (
      !_.isEmpty(selectedObjects) &&
      _.some(selectedObjects, o => _.isEqual(o, allObjects[idx]))
    );
  }

  isObjectHighlighted(idx: number) {
    let allObjects = this.getObjects();
    let highlightedObjects = this.getHighlightedObjects();
    return (
      !_.isEmpty(highlightedObjects) &&
      _.some(highlightedObjects, o => _.isEqual(o, allObjects[idx]))
    );
  }

  getObjects() {
    return findInFrames(
      this.props.item,
      'metadata.allObjects'
    ) as DetectedObject[];
  }

  getSelectedObjects() {
    return (findInFrames(this.props.item, 'metadata.objects') ||
      []) as DetectedObject[];
  }

  getHighlightedObjects() {
    return (findInFrames(this.props.item, 'metadata.highlightedObjects') ||
      []) as DetectedObject[];
  }

  onPanelExit() {
    this.filterSwatchSwitcherRef.current.onPanelExit();
  }
}
