import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';
import EventListener from 'react-event-listener';

import { findElement } from '../../helpers/frames';

import { DetectedObject, BackgroundImageElement } from '../../index';
import { FrameVisualizationProps } from './index';

import './DetectedObjects.scss';

export type DetectedObjectInteractionCommand =
  | 'highlightIn'
  | 'highlightOut'
  | 'toggleSelection'
  | 'resize'
  | 'moveFocalPoint';
type HorizontalAttr = 'left' | 'right';
type VerticalAttr = 'top' | 'bottom';
interface Point {
  x: number;
  y: number;
}

interface DetectedObjectsProps extends FrameVisualizationProps {
  all: boolean;
  position: React.CSSProperties;
  onInteract: (
    cmd: DetectedObjectInteractionCommand,
    object: DetectedObject,
    idx: number
  ) => void;
}
interface DetectedObjectsState {
  currentDragHandle?: {
    objectIndex: number;
    xAttr: HorizontalAttr;
    yAttr: VerticalAttr;
  };
  currentDragFocalPoint?: { objectIndex: number };
}
export class DetectedObjects extends React.Component<
  DetectedObjectsProps,
  DetectedObjectsState
> {
  containerRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: DetectedObjectsProps) {
    super(props);
    this.state = {};
    this.containerRef = React.createRef();
  }

  render() {
    return (
      <div
        className={this.getContainerClasses()}
        style={this.props.position}
        ref={this.containerRef}
      >
        {this.getObjectsToRender().map(({ object, idx }) =>
          this.renderObject(object, idx)
        )}
        <EventListener
          target="document"
          onMouseMove={evt => this.onMouseMove(evt)}
          onMouseUp={evt => this.onMouseUp(evt)}
        />
      </div>
    );
  }

  renderObject(object: DetectedObject, idx: number) {
    return (
      <div
        key={idx}
        className={this.getObjectClasses(object)}
        style={this.getObjectPosition(object)}
        onMouseOver={() =>
          this.props.onInteract &&
          this.props.onInteract('highlightIn', object, idx)
        }
        onMouseOut={() =>
          this.props.onInteract &&
          this.props.onInteract('highlightOut', object, idx)
        }
        onClick={(evt: React.SyntheticEvent) => {
          let target = evt.target as HTMLDivElement;
          this.props.onInteract &&
            !target.classList.contains(
              'detectedObjectsVisualization--objectHandle'
            ) &&
            !target.classList.contains(
              'detectedObjectsVisualization--focalPoint'
            ) &&
            this.props.onInteract('toggleSelection', object, idx);
          evt.stopPropagation();
        }}
      >
        {this.isSelected(object) && this.renderObjectHandles(object, idx)}
        <svg className="detectedObjectsVisualization--objectBoundary">
          <rect width="100%" height="100%" y="0" x="0" />
        </svg>
        {this.isSelected(object) && (
          <div
            className={classNames('detectedObjectsVisualization--focalPoint', {
              'is-interactive': !!this.props.onInteract
            })}
            style={this.getFocalPointPosition(object)}
            onMouseDown={evt => this.onMouseDownOnFocalPoint(evt, idx)}
          />
        )}
      </div>
    );
  }

  renderObjectHandles(object: DetectedObject, idx: number) {
    return [
      <div
        key="lt"
        className="detectedObjectsVisualization--objectHandle left top"
        onMouseDown={evt =>
          this.onMouseDownOnDragHandle(evt, idx, 'left', 'top')
        }
      />,
      <div
        key="rt"
        className="detectedObjectsVisualization--objectHandle right top"
        onMouseDown={evt =>
          this.onMouseDownOnDragHandle(evt, idx, 'right', 'top')
        }
      />,
      <div
        key="lb"
        className="detectedObjectsVisualization--objectHandle left bottom"
        onMouseDown={evt =>
          this.onMouseDownOnDragHandle(evt, idx, 'left', 'bottom')
        }
      />,
      <div
        key="rb"
        className="detectedObjectsVisualization--objectHandle right bottom"
        onMouseDown={evt =>
          this.onMouseDownOnDragHandle(evt, idx, 'right', 'bottom')
        }
      />
    ];
  }

  getFocalPointPosition(object: DetectedObject) {
    let relX =
      (object.focalPoint[0] - object.left) / (object.right - object.left);
    let relY =
      (object.focalPoint[1] - object.top) / (object.bottom - object.top);
    return { left: `${relX * 100}%`, top: `${relY * 100}%` };
  }

  onMouseDownOnDragHandle(
    evt: React.SyntheticEvent,
    objectIndex: number,
    xAttr: HorizontalAttr,
    yAttr: VerticalAttr
  ) {
    this.setState({
      currentDragHandle: { objectIndex, xAttr, yAttr }
    });
    evt.preventDefault();
  }

  onMouseDownOnFocalPoint(evt: React.SyntheticEvent, objectIndex: number) {
    this.setState({
      currentDragFocalPoint: { objectIndex }
    });
  }

  onMouseMove(evt: MouseEvent) {
    if (this.state.currentDragHandle) {
      let newMousePos = this.getRelativeCoordinates(evt);
      let { objectIndex, xAttr, yAttr } = this.state.currentDragHandle;
      let object = this.getObjects()[objectIndex];
      let updatedObject = {
        ...object,
        [xAttr]: this.clampObjectXCoordinate(newMousePos, object, xAttr),
        [yAttr]: this.clampObjectYCoordinate(newMousePos, object, yAttr)
      };
      this.props.onInteract &&
        this.props.onInteract('resize', updatedObject, objectIndex);
      evt.preventDefault();
    } else if (this.state.currentDragFocalPoint) {
      let newMousePos = this.getRelativeCoordinates(evt);
      let { objectIndex } = this.state.currentDragFocalPoint;
      let object = this.getObjects()[objectIndex];
      let newX = this.scaleX(newMousePos.x);
      let newY = this.scaleY(newMousePos.y);
      let updatedObject = {
        ...object,
        focalPoint: [
          Math.max(object.left, Math.min(object.right, newX)),
          Math.max(object.top, Math.min(object.bottom, newY))
        ]
      } as DetectedObject;
      this.props.onInteract &&
        this.props.onInteract('moveFocalPoint', updatedObject, objectIndex);
      evt.preventDefault();
    }
  }

  clampObjectXCoordinate(
    mousePos: Point,
    object: DetectedObject,
    attr: HorizontalAttr
  ) {
    let x = this.scaleX(mousePos.x);
    x = Math.max(0, x);
    x = Math.min(this.getOriginalBackgroundSize().width, x);
    if (attr === 'left') {
      x = Math.min(x, object.right);
      x = Math.min(x, object.focalPoint[0]);
    } else if (attr === 'right') {
      x = Math.max(x, object.left);
      x = Math.max(x, object.focalPoint[0]);
    }
    return x;
  }

  clampObjectYCoordinate(
    mousePos: Point,
    object: DetectedObject,
    attr: VerticalAttr
  ) {
    let y = this.scaleY(mousePos.y);
    y = Math.max(0, y);
    y = Math.min(this.getOriginalBackgroundSize().height, y);
    if (attr === 'top') {
      y = Math.min(y, object.bottom);
      y = Math.min(y, object.focalPoint[1]);
    } else if (attr === 'bottom') {
      y = Math.max(y, object.top);
      y = Math.max(y, object.focalPoint[1]);
    }
    return y;
  }

  scaleX(x: number) {
    let containerWidth = this.containerRef.current.getBoundingClientRect()
      .width;
    let imgWidth = this.getOriginalBackgroundSize().width;
    return (x / containerWidth) * imgWidth;
  }

  scaleY(y: number) {
    let containerHeight = this.containerRef.current.getBoundingClientRect()
      .height;
    let imgHeight = this.getOriginalBackgroundSize().height;
    return (y / containerHeight) * imgHeight;
  }

  getRelativeCoordinates(evt: MouseEvent): Point {
    let bounds = this.containerRef.current.getBoundingClientRect();
    return {
      x: evt.clientX - bounds.left,
      y: evt.clientY - bounds.top
    };
  }

  onMouseUp(evt: MouseEvent) {
    if (this.state.currentDragHandle || this.state.currentDragFocalPoint) {
      this.setState({
        currentDragHandle: null,
        currentDragFocalPoint: null
      });
      evt.preventDefault();
      evt.stopPropagation();
    }
  }

  getContainerClasses() {
    return classNames('detectedObjectsVisualization', {
      'has-highlighted-object': !_.isEmpty(
        this.props.frame.metadata.highlightedObjects
      ),
      'has-selected-object': !_.isEmpty(this.props.frame.metadata.objects),
      'is-interactive': !!this.props.onInteract
    });
  }

  getObjectClasses(object: DetectedObject) {
    let result = 'detectedObjectsVisualization--object ';
    if (this.isHighlighted(object)) {
      result += 'is-highlighted ';
    }
    if (this.isSelected(object)) {
      result += 'is-selected ';
    }
    return result;
  }

  isHighlighted(object: DetectedObject) {
    let highlightedObjects = this.props.frame.metadata.highlightedObjects || [];
    return _.some(highlightedObjects, object);
  }

  isSelected(object: DetectedObject) {
    let selectedObjects = this.props.frame.metadata.objects || [];
    return _.some(selectedObjects, object);
  }

  getObjects() {
    let objects = this.props.all
      ? this.props.frame.metadata.allObjects
      : this.props.frame.metadata.objects;
    return objects || [];
  }

  getObjectsToRender() {
    let objectsWithIndexes = this.getObjects().map((object, idx) => ({
      object,
      idx
    }));
    return _.reverse(
      _.sortBy(objectsWithIndexes, o => this.getObjectArea(o.object))
    );
  }

  getObjectArea(object: DetectedObject) {
    let width = object.right - object.left;
    let height = object.bottom - object.top;
    return width * height;
  }

  getObjectPosition(object: DetectedObject) {
    let { width, height } = this.getOriginalBackgroundSize();
    return {
      left: `${(object.left / width) * 100}%`,
      width: `${((object.right - object.left) / width) * 100}%`,
      top: `${(object.top / height) * 100}%`,
      height: `${((object.bottom - object.top) / height) * 100}%`
    };
  }

  getOriginalBackgroundSize() {
    let background = findElement(
      this.props.item,
      'background_image'
    ) as BackgroundImageElement;
    return background.originalSize;
  }
}
