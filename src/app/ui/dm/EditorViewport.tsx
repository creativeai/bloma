import * as React from 'react';
import classNames from 'classnames';
import * as _ from 'lodash';

import { Grid, SizeFormat } from '../../index';
import { ViewportPosition } from './viewport_utils';

import './EditorViewport.scss';
import { getGridRowY, getGridColumnX } from '../../helpers/grid';

interface EditorViewportProps {
  viewportPosition: ViewportPosition;
  grid: Grid;
  size: SizeFormat;
}

export class EditorViewport extends React.Component<EditorViewportProps> {
  render() {
    let { viewportPosition, grid, size } = this.props;
    return [
      <div
        key="viewport"
        className="directEditor--viewport"
        style={viewportPosition}
      >
        {_.range(grid.columns).map(column => (
          <React.Fragment key={`colMarker-${column}`}>
            <div
              className={classNames('directEditor--gridColumnMarker', {
                'is-module': column % grid.unitsPerHorizontalModule === 0
              })}
              style={getGridColumnMarkerPosition(
                column,
                'left',
                viewportPosition,
                grid,
                size
              )}
            />
            <div
              className={classNames('directEditor--gridColumnMarker', {
                'is-module': column % grid.unitsPerHorizontalModule === 0
              })}
              style={getGridColumnMarkerPosition(
                column + 1,
                'right',
                viewportPosition,
                grid,
                size
              )}
            />
          </React.Fragment>
        ))}
        {_.range(grid.rows + 1).map(row => (
          <div
            key={`rowMarker-${row}`}
            className={classNames('directEditor--gridRowMarker', {
              'is-module': row % grid.unitsPerVerticalModule === 0
            })}
            style={getGridRowMarkerPosition(row, viewportPosition, grid, size)}
          />
        ))}
      </div>,
      <div
        key="masktop"
        className="directEditor--mask"
        style={getMaskPosition('top', viewportPosition)}
      />,
      <div
        key="maskright"
        className="directEditor--mask"
        style={getMaskPosition('right', viewportPosition)}
      />,
      <div
        key="maskbottom"
        className="directEditor--mask"
        style={getMaskPosition('bottom', viewportPosition)}
      />,
      <div
        key="maskleft"
        className="directEditor--mask"
        style={getMaskPosition('left', viewportPosition)}
      />
    ];
  }
}

function getGridColumnMarkerPosition(
  column: number,
  edge: 'left' | 'right',
  viewportPosition: ViewportPosition,
  grid: Grid,
  size: SizeFormat
) {
  let viewportWidth = viewportPosition.width;
  let viewportHeight = viewportPosition.height;
  let verticalMarginPx = (grid.verticalMargin / size.height) * viewportHeight;
  return {
    transform: `translateX(${getGridColumnX(
      column,
      edge,
      grid,
      size,
      viewportWidth
    ) - 0.5}px)`,
    top: verticalMarginPx,
    bottom: verticalMarginPx
  };
}

function getGridRowMarkerPosition(
  row: number,
  viewportPosition: ViewportPosition,
  grid: Grid,
  size: SizeFormat
) {
  let viewportWidth = viewportPosition.width;
  let viewportHeight = viewportPosition.height;
  let horizontalMarginPx = (grid.horizontalMargin / size.width) * viewportWidth;
  return {
    transform: `translateY(${getGridRowY(row, grid, size, viewportHeight) -
      0.5}px)`,
    left: horizontalMarginPx,
    right: horizontalMarginPx
  };
}

function getMaskPosition(
  side: 'top' | 'bottom' | 'right' | 'left',
  viewportPosition: ViewportPosition
) {
  let viewportLeft = viewportPosition.left;
  let viewportRight = viewportLeft;
  let viewportTop = viewportPosition.top;
  let viewportBottom = viewportTop;
  let viewportWidth = viewportPosition.width;
  let viewportHeight = viewportPosition.height;
  switch (side) {
    case 'top':
      return {
        left: viewportLeft,
        right: viewportRight,
        top: 0,
        bottom: viewportTop + viewportHeight
      };
    case 'right':
      return {
        left: viewportRight + viewportWidth,
        right: 0,
        top: 0,
        bottom: 0
      };
    case 'bottom':
      return {
        left: viewportLeft,
        right: viewportRight,
        top: viewportBottom + viewportHeight,
        bottom: 0
      };
    case 'left':
      return {
        left: 0,
        right: viewportRight + viewportWidth,
        top: 0,
        bottom: 0
      };
  }
}
