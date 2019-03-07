import * as React from 'react';
import * as _ from 'lodash';
import EventListener from 'react-event-listener';

import {
  getViewportPosition,
  getBackgroundScreenPosition,
  getCropToViewportRatio,
  ViewportPosition
} from '../viewport_utils';
import { EditorViewport } from '../EditorViewport';
import { Rect, SizeFormat, BackgroundImageElement, Grid } from '../../../index';

import './CropEditor.scss';

interface CropEditorProps {
  crop: Rect;
  size: SizeFormat;
  grid: Grid;
  backgroundImage: BackgroundImageElement;
  onCropChange: (newCrop: Rect) => void;
}
interface CropEditorState {
  crop: Rect;
  draggingImage: boolean;
  resizingImage: ['top' | 'bottom', 'left' | 'right'];
  lastImageDragPos: { x: number; y: number };
}
export class CropEditor extends React.Component<
  CropEditorProps,
  CropEditorState
> {
  private containerRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: CropEditorProps) {
    super(props);
    this.state = {
      crop: null,
      draggingImage: false,
      resizingImage: null,
      lastImageDragPos: null
    };
  }

  componentWillMount() {
    this.setState({
      crop: this.props.crop
    });
  }

  componentDidMount() {
    this.setState({});
  }

  render() {
    let viewportPosition = getViewportPosition(
      this.props.size,
      this.containerRef.current
    );
    let imagePosition = getBackgroundScreenPosition(
      this.state.crop,
      this.props.size,
      this.containerRef.current,
      this.props.backgroundImage
    );
    return (
      <div className="cropEditor" ref={this.containerRef}>
        <EventListener
          target="document"
          onMouseMove={e => this.onDoImageOperations(e)}
          onMouseUp={e => this.onStopImageOperations(e)}
        />
        <div
          className="cropEditor--imageContainer"
          style={imagePosition}
          onMouseDown={e => this.onStartImageDrag(e)}
        >
          {this.props.children}
          <div className="cropEditor--imageFrame" />
          {[
            ['top', 'left'],
            ['top', 'right'],
            ['bottom', 'left'],
            ['bottom', 'right']
          ].map(([v, h]: ['top' | 'bottom', 'left' | 'right']) => (
            <div
              key={v + h}
              className={`cropEditor--imageHandle ${v} ${h}`}
              onMouseDown={e => this.onStartImageResize(e, v, h)}
            />
          ))}
        </div>
        <EditorViewport
          viewportPosition={viewportPosition}
          grid={this.props.grid}
          size={this.props.size}
        />
      </div>
    );
  }

  onStartImageDrag(evt: React.MouseEvent) {
    this.setState({
      draggingImage: true,
      lastImageDragPos: { x: evt.clientX, y: evt.clientY }
    });
    evt.preventDefault();
  }

  onStopImageOperations(evt: MouseEvent) {
    this.setState({
      draggingImage: false,
      lastImageDragPos: null,
      resizingImage: null
    });
    evt.preventDefault();
  }

  onDoImageOperations(evt: MouseEvent) {
    if (this.state.draggingImage) {
      this.onImageDrag(evt);
    } else if (this.state.resizingImage) {
      this.onImageResize(evt);
    }
  }

  onImageDrag(evt: MouseEvent) {
    let cropRatio = getCropToViewportRatio(
      this.state.crop,
      this.props.size,
      this.containerRef.current
    );
    let deltaX = (evt.clientX - this.state.lastImageDragPos.x) * cropRatio;
    let deltaY = (evt.clientY - this.state.lastImageDragPos.y) * cropRatio;
    let maxDeltaX = this.state.crop.left;
    let minDeltaX = -(
      this.props.backgroundImage.originalSize.width - this.state.crop.right
    );
    let maxDeltaY = this.state.crop.top;
    let minDeltaY = -(
      this.props.backgroundImage.originalSize.height - this.state.crop.bottom
    );
    deltaX = Math.round(Math.max(Math.min(deltaX, maxDeltaX), minDeltaX));
    deltaY = Math.round(Math.max(Math.min(deltaY, maxDeltaY), minDeltaY));
    this.setState(
      {
        crop: {
          left: this.state.crop.left - deltaX,
          right: this.state.crop.right - deltaX,
          top: this.state.crop.top - deltaY,
          bottom: this.state.crop.bottom - deltaY
        },
        lastImageDragPos: { x: evt.clientX, y: evt.clientY }
      },
      () => this.props.onCropChange(this.state.crop)
    );
  }

  onStartImageResize(
    evt: React.MouseEvent,
    vCorner: 'top' | 'bottom',
    hCorner: 'left' | 'right'
  ) {
    this.setState({
      resizingImage: [vCorner, hCorner]
    });
    evt.stopPropagation();
    evt.preventDefault();
  }

  onImageResize(evt: MouseEvent) {
    let aspectRatio = this.props.size.width / this.props.size.height;
    let viewportPos = getViewportPosition(
      this.props.size,
      this.containerRef.current
    );
    let imagePos = getBackgroundScreenPosition(
      this.state.crop,
      this.props.size,
      this.containerRef.current,
      this.props.backgroundImage
    );
    let newImagePos;
    let newHoriz = evt.clientX - this.containerRef.current.offsetLeft;
    let newVert = evt.clientY - this.containerRef.current.offsetTop;
    if (_.isEqual(this.state.resizingImage, ['top', 'left'])) {
      let deltaXBasedOnLeft = imagePos.left - newHoriz;
      let deltaYBasedOnLeft = deltaXBasedOnLeft / aspectRatio;
      let deltaYBasedOnTop = imagePos.top - newVert;
      let deltaXBasedOnTop = deltaYBasedOnTop * aspectRatio;
      let deltaX, deltaY;
      if (deltaYBasedOnLeft < deltaYBasedOnTop) {
        deltaX = deltaXBasedOnLeft;
        deltaY = deltaYBasedOnLeft;
      } else {
        deltaX = deltaXBasedOnTop;
        deltaY = deltaYBasedOnTop;
      }
      if (deltaX < imagePos.left - viewportPos.left) {
        deltaX = imagePos.left - viewportPos.left;
        deltaY = deltaX / aspectRatio;
      }
      if (deltaY < imagePos.top - viewportPos.top) {
        deltaY = imagePos.top - viewportPos.top;
        deltaX = deltaY * aspectRatio;
      }

      newImagePos = {
        left: imagePos.left - deltaX,
        top: imagePos.top - deltaY,
        width: imagePos.width + deltaX,
        height: imagePos.height + deltaY
      };
    } else if (_.isEqual(this.state.resizingImage, ['top', 'right'])) {
      let deltaXBasedOnRight = newHoriz - (imagePos.left + imagePos.width);
      let deltaYBasedOnRight = deltaXBasedOnRight / aspectRatio;
      let deltaYBasedOnTop = imagePos.top - newVert;
      let deltaXBasedOnTop = deltaYBasedOnTop * aspectRatio;
      let deltaX, deltaY;
      if (deltaYBasedOnRight < deltaYBasedOnTop) {
        deltaX = deltaXBasedOnRight;
        deltaY = deltaYBasedOnRight;
      } else {
        deltaX = deltaXBasedOnTop;
        deltaY = deltaYBasedOnTop;
      }
      if (
        deltaX <
        viewportPos.left + viewportPos.width - (imagePos.left + imagePos.width)
      ) {
        deltaX =
          viewportPos.left +
          viewportPos.width -
          (imagePos.left + imagePos.width);
        deltaY = deltaX / aspectRatio;
      }
      if (deltaY < imagePos.top - viewportPos.top) {
        deltaY = imagePos.top - viewportPos.top;
        deltaX = deltaY * aspectRatio;
      }

      newImagePos = {
        left: imagePos.left,
        top: imagePos.top - deltaY,
        width: imagePos.width + deltaX,
        height: imagePos.height + deltaY
      };
    } else if (_.isEqual(this.state.resizingImage, ['bottom', 'left'])) {
      let deltaXBasedOnLeft = imagePos.left - newHoriz;
      let deltaYBasedOnLeft = deltaXBasedOnLeft / aspectRatio;
      let deltaYBasedOnBottom = newVert - (imagePos.top + imagePos.height);
      let deltaXBasedOnBottom = deltaYBasedOnBottom * aspectRatio;
      let deltaX, deltaY;
      if (deltaYBasedOnLeft < deltaYBasedOnBottom) {
        deltaX = deltaXBasedOnLeft;
        deltaY = deltaYBasedOnLeft;
      } else {
        deltaX = deltaXBasedOnBottom;
        deltaY = deltaYBasedOnBottom;
      }
      if (deltaX < imagePos.left - viewportPos.left) {
        deltaX = imagePos.left - viewportPos.left;
        deltaY = deltaX / aspectRatio;
      }
      if (
        deltaY <
        viewportPos.top + viewportPos.height - (imagePos.top + imagePos.height)
      ) {
        deltaY =
          viewportPos.top +
          viewportPos.height -
          (imagePos.top + imagePos.height);
        deltaX = deltaY / aspectRatio;
      }
      newImagePos = {
        left: imagePos.left - deltaX,
        top: imagePos.top,
        width: imagePos.width + deltaX,
        height: imagePos.height + deltaY
      };
    } else {
      let deltaXBasedOnRight = newHoriz - (imagePos.left + imagePos.width);
      let deltaYBasedOnRight = deltaXBasedOnRight / aspectRatio;
      let deltaYBasedOnBottom = newVert - (imagePos.top + imagePos.height);
      let deltaXBasedOnBottom = deltaYBasedOnBottom * aspectRatio;
      let deltaX, deltaY;
      if (deltaYBasedOnRight < deltaYBasedOnBottom) {
        deltaX = deltaXBasedOnRight;
        deltaY = deltaYBasedOnRight;
      } else {
        deltaX = deltaXBasedOnBottom;
        deltaY = deltaYBasedOnBottom;
      }
      if (
        deltaX <
        viewportPos.left + viewportPos.width - (imagePos.left + imagePos.width)
      ) {
        deltaX =
          viewportPos.left +
          viewportPos.width -
          (imagePos.left + imagePos.width);
        deltaY = deltaX / aspectRatio;
      }
      if (
        deltaY <
        viewportPos.top + viewportPos.height - (imagePos.top + imagePos.height)
      ) {
        deltaY =
          viewportPos.top +
          viewportPos.height -
          (imagePos.top + imagePos.height);
        deltaX = deltaY / aspectRatio;
      }
      newImagePos = {
        left: imagePos.left,
        top: imagePos.top,
        width: imagePos.width + deltaX,
        height: imagePos.height + deltaY
      };
    }

    let newCrop = this.getCrop(viewportPos, newImagePos);
    this.setState({ crop: newCrop }, () => this.props.onCropChange(newCrop));
  }

  getCrop(
    viewportPosition: ViewportPosition,
    imageScreenPosition: ViewportPosition
  ) {
    let imageScreenToOriginalRatio =
      imageScreenPosition.width / this.props.backgroundImage.originalSize.width;
    let viewportImageLeft = viewportPosition.left - imageScreenPosition.left;
    let viewportImageTop = viewportPosition.top - imageScreenPosition.top;
    let viewportImageRight = viewportImageLeft + viewportPosition.width;
    let viewportImageBottom = viewportImageTop + viewportPosition.height;
    return {
      left: Math.round(viewportImageLeft / imageScreenToOriginalRatio),
      top: Math.round(viewportImageTop / imageScreenToOriginalRatio),
      right: Math.round(viewportImageRight / imageScreenToOriginalRatio),
      bottom: Math.round(viewportImageBottom / imageScreenToOriginalRatio)
    };
  }
}
