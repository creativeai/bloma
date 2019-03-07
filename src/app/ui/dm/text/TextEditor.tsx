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
  Alignment,
  SizeFormat,
  BackgroundImageElement,
  BackgroundColorElement,
  Grid,
  VerticalAlignment,
  HorizontalAlignment
} from '../../../index';

import './TextEditor.scss';
import {
  getGridColumnX,
  getGridRowY,
  getNearestGridColumnForX,
  getNearestGridRowForY
} from '../../../helpers/grid';

interface TextEditorProps {
  crop: Rect;
  size: SizeFormat;
  grid: Grid;
  textRect: Rect;
  backgroundElement: BackgroundImageElement | BackgroundColorElement;
  onTextRectChange: (newRect: Rect, alignment: Alignment) => void;
  onTextAlignmentChange: (newAlignment: Alignment) => void;
}
interface TextEditorState {
  textRect: Rect;
  manualAlignmentSetTo: Alignment;
  resizingPos: [VerticalAlignment, HorizontalAlignment];
  lastResizePos: [number, number];
  dragRemainder: { x: number; y: number };
}
export class TextEditor extends React.Component<
  TextEditorProps,
  TextEditorState
> {
  private containerRef: React.RefObject<HTMLDivElement> = React.createRef();
  private notifyTextRectChange: () => void;

  constructor(props: TextEditorProps) {
    super(props);
    this.containerRef = React.createRef();
    this.notifyTextRectChange = _.debounce(
      () =>
        this.props.onTextRectChange(
          this.state.textRect,
          this.state.manualAlignmentSetTo
        ),
      75
    );
    this.state = {
      resizingPos: null,
      lastResizePos: null,
      dragRemainder: { x: 0, y: 0 },
      textRect: null,
      manualAlignmentSetTo: null
    };
  }

  componentWillMount() {
    this.setState({
      textRect: this.props.textRect
    });
  }

  componentDidMount() {
    this.setState({});
  }

  componentWillReceiveProps(newProps: TextEditorProps) {
    if (!_.isEqual(newProps.textRect, this.props.textRect)) {
      this.setState({ textRect: newProps.textRect });
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
      <div className="textEditor" ref={this.containerRef}>
        <EventListener
          target="document"
          onMouseMove={e => this.onTextResize(e)}
          onMouseUp={e => this.onStopTextResize(e)}
        />
        <div className="textEditor--imageContainer" style={imagePosition}>
          {this.props.children}
        </div>
        <EditorViewport
          viewportPosition={viewportPosition}
          grid={this.props.grid}
          size={this.props.size}
        />
        {this.renderHandles(viewportPosition)}
        {/*this.renderSliders(viewportPosition)*/}
      </div>
    );
  }

  renderHandles(viewportPosition: ViewportPosition) {
    let rect = this.state.textRect;
    let grid = this.props.grid;
    let size = this.props.size;
    let resizing = this.state.resizingPos;
    let pos = this.state.lastResizePos;
    let handleSize = 10;

    let leftRem = 0,
      rightRem = 0,
      topRem = 0,
      bottomRem = 0;
    if (resizing && pos) {
      leftRem =
        resizing[1] === 'left'
          ? pos[0] -
            getGridColumnX(
              rect.left,
              'left',
              grid,
              size,
              viewportPosition.width
            )
          : 0;
      // leftRem = Math.max(leftRem, -rect.left * cellWidth);
      // leftRem = Math.min(leftRem, (rect.right - rect.left - 1) * cellWidth);
      rightRem =
        resizing[1] === 'right'
          ? pos[0] -
            getGridColumnX(
              rect.right,
              'right',
              grid,
              size,
              viewportPosition.width
            )
          : 0;
      // rightRem = Math.min(
      //   rightRem,
      //   (this.props.grid.columns - rect.right) * cellWidth
      // );
      // rightRem = Math.max(rightRem, (rect.left - rect.right + 1) * cellWidth);
      topRem =
        resizing[0] === 'top'
          ? pos[1] - getGridRowY(rect.top, grid, size, viewportPosition.height)
          : 0;
      // topRem = Math.max(topRem, -rect.top * cellHeight);
      // topRem = Math.min(topRem, (rect.bottom - rect.top - 1) * cellHeight);
      bottomRem =
        resizing[0] === 'bottom'
          ? pos[1] -
            getGridRowY(rect.bottom, grid, size, viewportPosition.height)
          : 0;
      // bottomRem = Math.min(
      //   bottomRem,
      //   (this.props.grid.rows - rect.bottom) * cellHeight
      // );
      // bottomRem = Math.max(
      //   bottomRem,
      //   (rect.top - rect.bottom + 1) * cellHeight
      // );
    }

    let left =
      viewportPosition.left +
      getGridColumnX(rect.left, 'left', grid, size, viewportPosition.width) -
      handleSize / 2 +
      leftRem;
    let right =
      viewportPosition.left +
      getGridColumnX(rect.right, 'right', grid, size, viewportPosition.width) -
      handleSize / 2 +
      rightRem;
    let hCenter = left + (right - left) / 2;
    let top =
      viewportPosition.top +
      getGridRowY(rect.top, grid, size, viewportPosition.height) -
      handleSize / 2 +
      topRem;
    let bottom =
      viewportPosition.top +
      getGridRowY(rect.bottom, grid, size, viewportPosition.height) -
      handleSize / 2 +
      bottomRem;
    let vCenter = top + (bottom - top) / 2;

    return [
      <div
        key="textFrame"
        className="textEditor--textFrame"
        style={{
          left: left + handleSize / 2,
          top: top + handleSize / 2,
          width: right - left,
          height: bottom - top
        }}
        onMouseDown={e => this.onStartTextResize(e, ['middle', 'center'])}
        onDoubleClick={e => this.onAlignmentChange(e, ['middle', 'center'])}
      />,
      <div
        key="handle-tl"
        className="textEditor--handle top left"
        style={{ left, top }}
        onMouseDown={e => this.onStartTextResize(e, ['top', 'left'])}
        onDoubleClick={e => this.onAlignmentChange(e, ['top', 'left'])}
      />,
      <div
        key="handle-tc"
        className="textEditor--handle top center"
        style={{ left: hCenter, top }}
        onMouseDown={e => this.onStartTextResize(e, ['top', 'center'])}
        onDoubleClick={e => this.onAlignmentChange(e, ['top', 'center'])}
      />,
      <div
        key="handle-tr"
        className="textEditor--handle top right"
        style={{ left: right, top }}
        onMouseDown={e => this.onStartTextResize(e, ['top', 'right'])}
        onDoubleClick={e => this.onAlignmentChange(e, ['top', 'right'])}
      />,
      <div
        key="handle-mr"
        className="textEditor--handle middle right"
        style={{ left: right, top: vCenter }}
        onMouseDown={e => this.onStartTextResize(e, ['middle', 'right'])}
        onDoubleClick={e => this.onAlignmentChange(e, ['middle', 'right'])}
      />,
      <div
        key="handle-br"
        className="textEditor--handle bottom right"
        style={{ left: right, top: bottom }}
        onMouseDown={e => this.onStartTextResize(e, ['bottom', 'right'])}
        onDoubleClick={e => this.onAlignmentChange(e, ['bottom', 'right'])}
      />,
      <div
        key="handle-bc"
        className="textEditor--handle bottom center"
        style={{ left: hCenter, top: bottom }}
        onMouseDown={e => this.onStartTextResize(e, ['bottom', 'center'])}
        onDoubleClick={e => this.onAlignmentChange(e, ['bottom', 'center'])}
      />,
      <div
        key="handle-bl"
        className="textEditor--handle bottom left"
        style={{ left: left, top: bottom }}
        onMouseDown={e => this.onStartTextResize(e, ['bottom', 'left'])}
        onDoubleClick={e => this.onAlignmentChange(e, ['bottom', 'left'])}
      />,
      <div
        key="handle-ml"
        className="textEditor--handle middle left"
        style={{ left: left, top: vCenter }}
        onMouseDown={e => this.onStartTextResize(e, ['middle', 'left'])}
        onDoubleClick={e => this.onAlignmentChange(e, ['middle', 'left'])}
      />
    ];
  }

  onStartTextResize(
    event: React.MouseEvent,
    handlePos: [VerticalAlignment, HorizontalAlignment]
  ) {
    this.setState({
      resizingPos: handlePos
    });
    event.preventDefault();
  }

  onStopTextResize(event: MouseEvent) {
    this.setState({ resizingPos: null, lastResizePos: null });
    event.preventDefault();
  }

  onTextResize(event: MouseEvent) {
    if (this.state.resizingPos) {
      let grid = this.props.grid;
      let size = this.props.size;
      let down = this.state.resizingPos;
      let bounds = this.containerRef.current.getBoundingClientRect();
      let viewportPosition = getViewportPosition(
        this.props.size,
        this.containerRef.current
      );
      var pos = [
        event.clientX - bounds.left - viewportPosition.left,
        event.clientY - bounds.top - viewportPosition.top
      ];
      this.setState({ lastResizePos: pos as [number, number] });
      if (down[1] === 'center' && down[0] === 'middle') {
        let candidateX = getNearestGridColumnForX(
          pos[0],
          grid,
          size,
          viewportPosition.width
        );
        let candidateY = getNearestGridRowForY(
          pos[1],
          grid,
          size,
          viewportPosition.height
        );

        let halfWidth =
          (this.state.textRect.right - this.state.textRect.left) / 2;
        let halfHeight =
          (this.state.textRect.bottom - this.state.textRect.top) / 2;
        let minX = halfWidth;
        let maxX = this.props.grid.columns - halfWidth;
        let minY = halfHeight;
        let maxY = this.props.grid.rows - halfHeight;
        let midX = Math.min(maxX, Math.max(minX, candidateX));
        let midY = Math.min(maxY, Math.max(minY, candidateY));
        let newLeft = Math.round(midX - halfWidth);
        let newRight = Math.round(midX + halfWidth);
        let newTop = Math.round(midY - halfHeight);
        let newBottom = Math.round(midY + halfHeight);

        if (
          this.state.textRect.left !== newLeft ||
          this.state.textRect.top !== newTop
        ) {
          this.onTextRectChange({
            left: newLeft,
            right: newRight,
            top: newTop,
            bottom: newBottom
          });
        }
      } else {
        let candidateX = getNearestGridColumnForX(
          pos[0],
          grid,
          size,
          viewportPosition.width
        );
        let candidateY = getNearestGridRowForY(
          pos[1],
          grid,
          size,
          viewportPosition.height
        );

        let minX = down[1] === 'left' ? 0 : this.state.textRect.left + 1;
        let maxX =
          down[1] === 'left'
            ? this.state.textRect.right - 1
            : this.props.grid.columns;
        let minY = down[0] === 'top' ? 0 : this.state.textRect.top + 1;
        let maxY =
          down[0] === 'top'
            ? this.state.textRect.bottom - 1
            : this.props.grid.rows;

        let cellX = Math.min(maxX, Math.max(minX, candidateX));
        let cellY = Math.min(maxY, Math.max(minY, candidateY));

        if (
          (down[0] !== 'middle' && this.state.textRect[down[0]] !== cellY) ||
          (down[1] !== 'center' && this.state.textRect[down[1]] !== cellX)
        ) {
          let newRect = _.clone(this.state.textRect);
          if (down[0] !== 'middle') {
            newRect[down[0]] = cellY;
          }
          if (down[1] !== 'center') {
            newRect[down[1]] = cellX;
          }
          this.onTextRectChange(newRect);
        }
      }

      event.preventDefault();
    }
  }

  onTextRectChange(newRect: Rect) {
    this.setState({ textRect: newRect });
    this.notifyTextRectChange();
  }

  onAlignmentChange(
    event: React.MouseEvent,
    [vertical, horizontal]: [VerticalAlignment, HorizontalAlignment]
  ) {
    this.setState({ manualAlignmentSetTo: { vertical, horizontal } }, () => {
      this.props.onTextAlignmentChange({ vertical, horizontal });
    });
    event.preventDefault();
  }
}
