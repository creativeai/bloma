import * as React from 'react';
import * as _ from 'lodash';
import EventListener from 'react-event-listener';

import {
  getViewportPosition,
  getBackgroundScreenPosition,
  ViewportPosition
} from '../viewport_utils';
import { EditorViewport } from '../EditorViewport';
import {
  Rect,
  SizeFormat,
  BackgroundImageElement,
  BackgroundColorElement,
  Grid
} from '../../../index';

import './ImageEditor.scss';

type HandlePos = ['top' | 'middle' | 'bottom', 'left' | 'center' | 'right'];
interface ImageEditorProps {
  size: SizeFormat;
  grid: Grid;
  crop: Rect;
  backgroundElement: BackgroundImageElement | BackgroundColorElement;
  contentRect: Rect;
  onContentRectChange: (newRect: Rect) => void;
}
interface ImageEditorState {
  contentRect: Rect;
  resizingPos: HandlePos;
  resizingAt: { x: number; y: number };
  dragRemainder: { x: number; y: number };
}
export class ImageEditor extends React.Component<
  ImageEditorProps,
  ImageEditorState
> {
  private containerRef: React.RefObject<HTMLDivElement> = React.createRef();

  constructor(props: ImageEditorProps) {
    super(props);
    this.state = {
      resizingAt: null,
      resizingPos: null,
      dragRemainder: { x: 0, y: 0 },
      contentRect: null
    };
  }

  componentWillMount() {
    this.setState({
      contentRect: this.props.contentRect
    });
  }

  componentDidMount() {
    this.setState({});
  }

  componentWillReceiveProps(newProps: ImageEditorProps) {
    if (!_.isEqual(newProps.contentRect, this.props.contentRect)) {
      this.setState({ contentRect: newProps.contentRect });
    }
  }

  render() {
    let viewportPosition = getViewportPosition(
      this.props.size,
      this.containerRef.current
    );
    let imagePosition = getBackgroundScreenPosition(
      this.props.crop,
      this.props.size,
      this.containerRef.current,
      this.props.backgroundElement
    );
    return (
      <div className="imageEditor" ref={this.containerRef}>
        <EventListener
          target="document"
          onMouseMove={e => this.onResize(e)}
          onMouseUp={e => this.onStopResize(e)}
        />
        <div className="imageEditor--imageContainer" style={imagePosition}>
          {this.props.children}
        </div>
        <EditorViewport
          viewportPosition={viewportPosition}
          grid={this.props.grid}
          size={this.props.size}
        />
        {this.renderHandles(viewportPosition)}
      </div>
    );
  }

  renderHandles(viewportPosition: ViewportPosition) {
    let rect = this.state.contentRect;
    let handleSize = 10;

    let viewportScale = viewportPosition.width / this.props.size.width;

    let left =
      viewportPosition.left + rect.left * viewportScale - handleSize / 2;
    let right =
      viewportPosition.left + rect.right * viewportScale - handleSize / 2;
    let hCenter = left + (right - left) / 2;
    let top = viewportPosition.top + rect.top * viewportScale - handleSize / 2;
    let bottom =
      viewportPosition.top + rect.bottom * viewportScale - handleSize / 2;
    let vCenter = top + (bottom - top) / 2;

    return [
      <div
        key="imageFrame"
        className="imageEditor--imageFrame"
        style={{
          left: left + handleSize / 2,
          top: top + handleSize / 2,
          width: right - left,
          height: bottom - top
        }}
        onMouseDown={e => this.onStartResize(e, ['middle', 'center'])}
      />,
      <div
        key="handle-tl"
        className="imageEditor--handle top left"
        style={{ left, top }}
        onMouseDown={e => this.onStartResize(e, ['top', 'left'])}
      />,
      <div
        key="handle-tc"
        className="imageEditor--handle top center"
        style={{ left: hCenter, top }}
        onMouseDown={e => this.onStartResize(e, ['top', 'center'])}
      />,
      <div
        key="handle-tr"
        className="imageEditor--handle top right"
        style={{ left: right, top }}
        onMouseDown={e => this.onStartResize(e, ['top', 'right'])}
      />,
      <div
        key="handle-mr"
        className="imageEditor--handle middle right"
        style={{ left: right, top: vCenter }}
        onMouseDown={e => this.onStartResize(e, ['middle', 'right'])}
      />,
      <div
        key="handle-br"
        className="imageEditor--handle bottom right"
        style={{ left: right, top: bottom }}
        onMouseDown={e => this.onStartResize(e, ['bottom', 'right'])}
      />,
      <div
        key="handle-bc"
        className="imageEditor--handle bottom center"
        style={{ left: hCenter, top: bottom }}
        onMouseDown={e => this.onStartResize(e, ['bottom', 'center'])}
      />,
      <div
        key="handle-bl"
        className="imageEditor--handle bottom left"
        style={{ left: left, top: bottom }}
        onMouseDown={e => this.onStartResize(e, ['bottom', 'left'])}
      />,
      <div
        key="handle-ml"
        className="imageEditor--handle middle left"
        style={{ left: left, top: vCenter }}
        onMouseDown={e => this.onStartResize(e, ['middle', 'left'])}
      />
    ];
  }

  onStartResize(event: React.MouseEvent, handlePos: HandlePos) {
    let bounds = this.containerRef.current.getBoundingClientRect();
    let viewportPosition = getViewportPosition(
      this.props.size,
      this.containerRef.current
    );
    let viewportScale = viewportPosition.width / this.props.size.width;
    let posX =
      (event.clientX - bounds.left - viewportPosition.left) / viewportScale;
    let posY =
      (event.clientY - bounds.top - viewportPosition.top) / viewportScale;
    this.setState({
      resizingPos: handlePos,
      resizingAt: {
        x:
          (posX - this.state.contentRect.left) /
          (this.state.contentRect.right - this.state.contentRect.left),
        y:
          (posY - this.state.contentRect.top) /
          (this.state.contentRect.bottom - this.state.contentRect.top)
      }
    });
    event.preventDefault();
  }

  onStopResize(event: MouseEvent) {
    this.setState({ resizingPos: null, resizingAt: null });
    event.preventDefault();
  }

  onResize(event: MouseEvent) {
    if (this.state.resizingPos) {
      let down = this.state.resizingPos;
      let downAt = this.state.resizingAt;
      let bounds = this.containerRef.current.getBoundingClientRect();
      let viewportPosition = getViewportPosition(
        this.props.size,
        this.containerRef.current
      );
      let viewportScale = viewportPosition.width / this.props.size.width;
      let pos = [
        event.clientX - bounds.left - viewportPosition.left,
        event.clientY - bounds.top - viewportPosition.top
      ];
      let candidateX = pos[0] / viewportScale;
      let candidateY = pos[1] / viewportScale;
      if (down[1] === 'center' && down[0] === 'middle') {
        let widthBeforePoint =
          (this.state.contentRect.right - this.state.contentRect.left) *
          downAt.x;
        let widthAfterPoint =
          (this.state.contentRect.right - this.state.contentRect.left) *
          (1 - downAt.x);
        let heightBeforePoint =
          (this.state.contentRect.bottom - this.state.contentRect.top) *
          downAt.y;
        let heightAfterPoint =
          (this.state.contentRect.bottom - this.state.contentRect.top) *
          (1 - downAt.y);

        let minX = widthBeforePoint;
        let maxX = viewportPosition.width / viewportScale - widthAfterPoint;
        let minY = heightBeforePoint;
        let maxY = viewportPosition.height / viewportScale - heightAfterPoint;
        let midX = Math.min(maxX, Math.max(minX, candidateX));
        let midY = Math.min(maxY, Math.max(minY, candidateY));
        let newLeft = Math.round(midX - widthBeforePoint);
        let newRight = Math.round(midX + widthAfterPoint);
        let newTop = Math.round(midY - heightBeforePoint);
        let newBottom = Math.round(midY + heightAfterPoint);
        if (
          this.state.contentRect.left !== newLeft ||
          this.state.contentRect.top !== newTop
        ) {
          this.onContentRectChange({
            left: newLeft,
            right: newRight,
            top: newTop,
            bottom: newBottom
          });
        }
      } else {
        let aspectRatio =
          (this.state.contentRect.right - this.state.contentRect.left) /
          (this.state.contentRect.bottom - this.state.contentRect.top);

        let newRect = _.clone(this.state.contentRect);
        if (down[0] === 'top') {
          let candidateHeight = this.state.contentRect.bottom - candidateY;
          let candidateWidth = candidateHeight * aspectRatio;
          newRect.top = candidateY;
          if (down[1] === 'left') {
            newRect.left = this.state.contentRect.right - candidateWidth;
          } else {
            newRect.right = this.state.contentRect.left + candidateWidth;
          }
        } else if (down[0] === 'bottom') {
          let candidateHeight = candidateY - this.state.contentRect.top;
          let candidateWidth = candidateHeight * aspectRatio;
          newRect.bottom = candidateY;
          if (down[1] === 'left') {
            newRect.left = this.state.contentRect.right - candidateWidth;
          } else {
            newRect.right = this.state.contentRect.left + candidateWidth;
          }
        } else {
          let candidateWidth;
          if (down[1] === 'left') {
            candidateWidth = this.state.contentRect.right - candidateX;
            newRect.left = candidateX;
          } else {
            candidateWidth = candidateX - this.state.contentRect.left;
            newRect.right = candidateX;
          }
          let candidateHeight = candidateWidth / aspectRatio;
          newRect.bottom = this.state.contentRect.top + candidateHeight;
        }

        if (!_.isEqual(newRect, this.state.contentRect)) {
          this.onContentRectChange(newRect);
        }
      }

      event.preventDefault();
    }
  }

  onContentRectChange(newRect: Rect) {
    this.setState({ contentRect: newRect });
    this.props.onContentRectChange(this.state.contentRect);
  }
}
