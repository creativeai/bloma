import * as _ from 'lodash';

import { getRectArea, intersectRect } from './geometry';
import { Rect, Grid, Element } from '../index';

export type Point = [number, number];

export type Corner = [Point, Point];

export interface Corners {
  corners: Point[];
  extent: Rect;
}

export function generateRects(
  fromPoint: Point,
  extent: Rect,
  grid: Grid
): Rect[] {
  let xs, ys;
  if (fromPoint[0] === extent.left) {
    // Growing widths pinned to the left point
    xs = _.range(extent.left + 1, extent.right).map(right => [
      fromPoint[0],
      right
    ]);
  } else if (fromPoint[0] === extent.right) {
    // Growing widths pinned to the right point
    xs = _.range(extent.left + 1, extent.right).map(left => [
      left,
      fromPoint[0]
    ]);
  } else {
    // Growing widths pinned at center, growing symmetrically in each direction
    xs = [];
    for (
      let left = Math.floor(fromPoint[0]), right = Math.floor(fromPoint[0]);
      left >= extent.left && right <= extent.right;
      left--, right++
    ) {
      xs.push([left, right]);
    }
  }
  if (fromPoint[1] === extent.top) {
    // Growing heights pinned to the top point
    ys = _.range(extent.top + 1, extent.bottom).map(bottom => [
      fromPoint[1],
      bottom
    ]);
  } else if (fromPoint[1] === extent.bottom) {
    // Growing heights pinned to the bottom point
    ys = _.range(extent.top + 1, extent.bottom).map(top => [top, fromPoint[1]]);
  } else {
    // Growing heights pinned in the middle, growing symmetrically in each direction
    ys = [];
    for (
      let top = Math.floor(fromPoint[1]), bottom = Math.floor(fromPoint[1]);
      top >= extent.top && bottom <= extent.bottom;
      top--, bottom++
    ) {
      ys.push([top, bottom]);
    }
  }
  let results = [];
  for (let [left, right] of xs) {
    for (let [top, bottom] of ys) {
      if (getRectArea({ left, right, top, bottom }) > 0) {
        results.push({
          left: left * grid.unitsPerHorizontalModule,
          right: right * grid.unitsPerHorizontalModule,
          top: top * grid.unitsPerVerticalModule,
          bottom: bottom * grid.unitsPerVerticalModule
        });
      }
    }
  }
  return results;
}

function generateCandidateRectsMemoizationResolver(extent: Rect, grid: Grid) {
  return `${extent.left}-${extent.right}-${extent.top}-${extent.bottom}-${
    grid.unitsPerHorizontalModule
  }-${grid.unitsPerVerticalModule}`;
}

let generateCandidateRects = _.memoize((extent: Rect, grid: Grid): Rect[] => {
  let results = [];
  for (let left = extent.left; left < extent.right - 1; left++) {
    for (let right = left + 1; right < extent.right; right++) {
      for (let top = extent.top; top < extent.bottom - 1; top++) {
        for (let bottom = top + 1; bottom < extent.bottom; bottom++) {
          results.push({
            left: left * grid.unitsPerHorizontalModule,
            right: right * grid.unitsPerHorizontalModule,
            top: top * grid.unitsPerVerticalModule,
            bottom: bottom * grid.unitsPerVerticalModule
          });
        }
      }
    }
  }
  return results;
}, generateCandidateRectsMemoizationResolver);

export function generateNonOverlappingRects(
  extent: Rect,
  grid: Grid,
  otherRects: Rect[]
) {
  let candidates = generateCandidateRects(extent, grid);
  let results = [];
  for (let candidate of candidates) {
    let doesOverlap = false;
    for (let other of otherRects) {
      if (intersectRect(candidate, other) > 0) {
        doesOverlap = true;
        break;
      }
    }
    if (!doesOverlap) {
      results.push(candidate);
    }
  }
  return results;
}

// For each corner, generate its mirrored version
function generateMirrorCorners(corners: Corner[]): Corner[] {
  let result: Corner[] = [];
  for (let [from, to] of corners) {
    result.push([to, from]);
  }
  return result;
}

function getContractions(grid: Grid, elementsToPlace: Element[]) {
  let hasBackground = _.find(elementsToPlace, { type: 'background_image' });
  if (hasBackground) {
    // If there's a background object we don't generate contractions
    return [0];
  } else {
    // Otherwise contract as much as there's room.
    return _.range(
      0,
      Math.round(Math.min(grid.rowModules, grid.columnModules) / 2) - 1
    );
  }
}

export function generateCorners(grid: Grid, elementsToPlace: Element[]) {
  let results: Corners[] = [];
  let contractions = getContractions(grid, elementsToPlace);
  contractions.forEach((contraction, index) => {
    let isOutermost = index === 0;
    let extent: Rect = {
        left: contraction,
        top: contraction,
        right: grid.columnModules - contraction,
        bottom: grid.rowModules - contraction
      },
      width = extent.right - extent.left,
      height = extent.bottom - extent.top;

    let topLeft: Point = [extent.left, extent.top];
    let topCenter: Point = [extent.left + width / 2, extent.top];
    let topRight: Point = [extent.right, extent.top];
    let bottomLeft: Point = [extent.left, extent.bottom];
    let bottomRight: Point = [extent.right, extent.bottom];
    let bottomCenter: Point = [extent.left + width / 2, extent.bottom];

    // Add the different orientations in order; inner contractions having only the centered axis
    let baseCorners: Corner[] = [];
    if (isOutermost) {
      baseCorners.push([topLeft, bottomRight]);
    }
    baseCorners.push([topCenter, bottomCenter]);
    if (isOutermost) {
      baseCorners.push([topLeft, bottomLeft]);
      baseCorners.push([topRight, bottomRight]);
      baseCorners.push([topRight, bottomLeft]);
      baseCorners.push([topRight, topLeft]);
      baseCorners.push([bottomRight, bottomLeft]);
    }

    results = results.concat(
      baseCorners
        .concat(generateMirrorCorners(baseCorners))
        .map(corners => ({ corners, extent }))
    );
  });
  return results;
}
