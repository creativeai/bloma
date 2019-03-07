import * as _ from 'lodash';
import { SizeFormat, Grid, Rect, Pixels } from '../index';

const OPTIMAL_BASE_UNIT = 16;
const OPTIMAL_RELATIVE_MARGIN = 0.07;
const UNITS_PER_MODULE = 10;
const UNITS_IN_MARGIN = _.range(3, 10);
const MODULE_COUNT_MULTIPLE_OF = 3;
const HORIZONTAL_GUTTER_SIZE = 1;

export function buildGrid(size: SizeFormat, margins = true): Grid {
  // How many rows using the optimal base unit size would fit this size
  let totalOptimalRows = Math.round(size.height / OPTIMAL_BASE_UNIT);
  let possibleUnitsInMargin = margins ? UNITS_IN_MARGIN : [0];

  // What would be the optimal margin in pixels in this size
  let optimalMargin =
    OPTIMAL_RELATIVE_MARGIN * Math.min(size.width, size.height);

  // For each potential margin base unit multiple...
  let marginUnitAssignments = possibleUnitsInMargin.map(unitsInMargin => {
    // See what amount of rows would fit best - counting for rows being divisible into modules
    let rowCounts = _.range(1, 10).map(
      modules =>
        modules * MODULE_COUNT_MULTIPLE_OF * UNITS_PER_MODULE +
        2 * unitsInMargin
    );
    // The best one is the one that differs from the total optimal number of rows the least
    let totalRows = _.minBy(rowCounts, cnt => Math.abs(cnt - totalOptimalRows));
    return { unitsInMargin, totalRows };
  });
  // Of the margin base unit multiples, find the one that is closest to the optimal margin
  let { unitsInMargin, totalRows } = _.minBy(marginUnitAssignments, a =>
    Math.abs(optimalMargin - (size.height / a.totalRows) * a.unitsInMargin)
  );

  let baseUnit = size.height / totalRows;
  let rows = totalRows - 2 * unitsInMargin;
  let margin = baseUnit * unitsInMargin;

  // Modules, one per x rows
  let rowModules = rows / UNITS_PER_MODULE;
  // Module height based on this
  let moduleHeight = baseUnit * UNITS_PER_MODULE;

  // Choose # of column modules to find a width that's close to the module height
  let columnModuleCandidates = _.range(1, 10).map(
    modules => modules * MODULE_COUNT_MULTIPLE_OF
  );
  let columnModules = _.minBy(columnModuleCandidates, c =>
    Math.abs(
      size.width -
        2 * margin -
        c * moduleHeight -
        (c - 1) * HORIZONTAL_GUTTER_SIZE * baseUnit
    )
  );
  let columns = columnModules;
  let gutterWidth = HORIZONTAL_GUTTER_SIZE * baseUnit;
  let totalGuttersWidth = (columns - 1) * gutterWidth;
  let moduleWidth = (size.width - 2 * margin - totalGuttersWidth) / columns;

  // console.log(
  //   size.width,
  //   size.height,
  //   'base',
  //   baseUnit,
  //   'size',
  //   columns,
  //   rows,
  //   'modules',
  //   columnModules,
  //   rowModules,
  //   'mod size',
  //   moduleWidth,
  //   moduleHeight,
  //   'margin',
  //   margin
  // );
  return {
    baseUnit,
    rows,
    columns,
    rowModules,
    columnModules,
    moduleHeight,
    moduleWidth,
    verticalMargin: margin,
    horizontalMargin: margin,
    gutterWidth,
    unitsPerHorizontalModule: 1,
    unitsPerVerticalModule: UNITS_PER_MODULE
  };
}

export function gridUnitRectToGridModuleRect(rect: Rect, grid: Grid): Rect {
  return {
    left: rect.left / grid.unitsPerHorizontalModule,
    right: rect.right / grid.unitsPerHorizontalModule,
    top: rect.top / grid.unitsPerVerticalModule,
    bottom: rect.bottom / grid.unitsPerVerticalModule
  };
}

export function getWidthSansMargin(format: SizeFormat, grid: Grid): Pixels {
  return format.width - 2 * grid.horizontalMargin;
}

export function getHeightSansMargin(format: SizeFormat, grid: Grid): Pixels {
  return format.height - 2 * grid.verticalMargin;
}

export function getGridRowHeight(grid: Grid, format: SizeFormat): Pixels {
  return getHeightSansMargin(format, grid) / grid.rows;
}

export function getGridColumnWidth(grid: Grid, format: SizeFormat): Pixels {
  let totalGuttersWidth = (grid.columns - 1) * grid.gutterWidth;
  return (getWidthSansMargin(format, grid) - totalGuttersWidth) / grid.columns;
}

export function getRectLeftUnits(rect: Rect, grid: Grid) {
  return rect.left;
}

export function getRectRightUnits(rect: Rect, grid: Grid) {
  return grid.columns - rect.right;
}

export function getRectWidthUnits(rect: Rect, grid: Grid) {
  return rect.right - rect.left;
}

export function getRectTopUnits(rect: Rect, grid: Grid) {
  return rect.top;
}

export function getGridBottomUnits(rect: Rect, grid: Grid) {
  return grid.rows - rect.bottom;
}

export function getRectHeightUnits(rect: Rect, grid: Grid) {
  return rect.bottom - rect.top;
}

export function getRectWidthPixels(
  rect: Rect,
  grid: Grid,
  format: SizeFormat
): Pixels {
  let widthUnits = rect.right - rect.left;
  return (
    widthUnits * getGridColumnWidth(grid, format) +
    (widthUnits - 1) * grid.gutterWidth
  );
}

export function getRectHeighthPixels(
  rect: Rect,
  grid: Grid,
  format: SizeFormat
): Pixels {
  return (rect.bottom - rect.top) * getGridRowHeight(grid, format);
}

export function getRectLeftPixels(rect: Rect, grid: Grid, format: SizeFormat) {
  return (
    grid.horizontalMargin +
    rect.left * (getGridColumnWidth(grid, format) + grid.gutterWidth)
  );
}

export function getRectTopPixels(rect: Rect, grid: Grid, format: SizeFormat) {
  return grid.verticalMargin + rect.top * getGridRowHeight(grid, format);
}

export function getRectRelativePosition(
  rect: Rect,
  grid: Grid,
  format: SizeFormat
): Rect {
  // How large are the margins relative to the layout size?
  let horizMarginRatio = grid.horizontalMargin / format.width;
  let vertMarginRatio = grid.verticalMargin / format.height;
  // How large are gutters relative to the layout size?
  let horizGutterRatio = grid.gutterWidth / format.width;
  // How large is the content area relative to the layout size?
  let horizContentRatio =
    1 - 2 * horizMarginRatio - (grid.columns - 1) * horizGutterRatio;
  let vertContentRatio = 1 - 2 * vertMarginRatio;
  // How large, then, is each grid unit relative to the layout size?
  let horizGridUnitRatio = horizContentRatio / grid.columns;
  let vertGridUnitRatio = vertContentRatio / grid.rows;
  // Based on this, what are the relative coordinates of the rectangle within the full layout?
  return {
    left:
      horizMarginRatio + rect.left * (horizGridUnitRatio + horizGutterRatio),
    right:
      horizMarginRatio +
      rect.right * horizGridUnitRatio +
      (rect.right - 1) * horizGutterRatio,
    top: vertMarginRatio + rect.top * vertGridUnitRatio,
    bottom: vertMarginRatio + rect.bottom * vertGridUnitRatio
  };
}

export function getGridRowY(
  row: number,
  grid: Grid,
  format: SizeFormat,
  displayHeight: Pixels
): Pixels {
  let verticalMarginPx = (grid.verticalMargin / format.height) * displayHeight;
  let heightSansMargin = displayHeight - verticalMarginPx * 2;
  let gridCellHeight = heightSansMargin / grid.rows;
  return verticalMarginPx + gridCellHeight * row;
}

export function getGridColumnX(
  column: number,
  edge: 'left' | 'right',
  grid: Grid,
  format: SizeFormat,
  displayWidth: Pixels
): Pixels {
  let horizontalMarginPx =
    (grid.horizontalMargin / format.width) * displayWidth;
  let horizontalGutterPx = (grid.gutterWidth / format.width) * displayWidth;
  let widthSansMarginAndGutters =
    displayWidth -
    horizontalMarginPx * 2 -
    horizontalGutterPx * (grid.columns - 1);
  let gridCellWidth = widthSansMarginAndGutters / grid.columns;
  if (edge === 'left') {
    return horizontalMarginPx + (gridCellWidth + horizontalGutterPx) * column;
  } else {
    return (
      horizontalMarginPx +
      gridCellWidth * column +
      horizontalGutterPx * (column - 1)
    );
  }
}

export function getNearestGridRowForY(
  y: Pixels,
  grid: Grid,
  format: SizeFormat,
  displayHeight: Pixels
) {
  let verticalMarginPx = (grid.verticalMargin / format.height) * displayHeight;
  let heightSansMargin = displayHeight - verticalMarginPx * 2;
  let gridCellHeight = heightSansMargin / grid.rows;
  return Math.round((y - verticalMarginPx) / gridCellHeight);
}

export function getNearestGridColumnForX(
  x: Pixels,
  grid: Grid,
  format: SizeFormat,
  displayWidth: Pixels
) {
  let horizontalMarginPx =
    (grid.horizontalMargin / format.width) * displayWidth;
  let widthSansMargin = displayWidth - horizontalMarginPx * 2;
  let gridCellWidth = widthSansMargin / grid.columns;
  return Math.round((x - horizontalMarginPx) / gridCellWidth);
}
