import { intersectRect } from './geometry';
import {
  Rect,
  DetectedObject,
  Grid,
  SizeFormat,
  ImageSize,
  Pixels
} from '../index';
import {
  getWidthSansMargin,
  getHeightSansMargin,
  getRectRelativePosition,
  getRectWidthUnits,
  getRectHeightUnits,
  getRectLeftUnits,
  getRectRightUnits,
  getRectTopUnits,
  getGridBottomUnits
} from './grid';

const LARGE_ENOUGH_SCORE_WEIGHT = 0.75;
const PRIORITY_SCORE_WEIGHT = 1.5;
const OBJECT_VISIBILITY_SCORE_WEIGHT = 1;
const OBJECT_POSITION_OVERLAP_SCORE_WEIGHT = 0.75;

interface CropScores {
  isLargeEnough: boolean;
  posPriority: number;
  objectCropIntersection: number;
  objectPosRectIntersection: number;
}

interface CropPosition extends Rect {
  object: DetectedObject;
  cropBasis: Rect;
  size: SizeFormat;
  grid: Grid;
  width: Pixels;
  height: Pixels;
  scores: CropScores;
  score?: number;
}

function calculateEnclosingRectangle(
  sourceWidth: number,
  sourceHeight: number,
  targetAspectRatio: number
) {
  let sourceAspectRatio = sourceWidth / sourceHeight;
  let aspectRatioChange = sourceAspectRatio / targetAspectRatio;
  let fitWidth =
    aspectRatioChange < 1 ? sourceHeight * targetAspectRatio : sourceWidth;
  let fitHeight =
    aspectRatioChange >= 1 ? sourceWidth / targetAspectRatio : sourceHeight;
  return { width: fitWidth, height: fitHeight };
}

// Find the largest rectangle
// - of the given aspect ratio
// - with the given "center" point positioned relative as given
// - that fits within the given bounds
function findLargestRectangle(
  centerX: Pixels,
  centerY: Pixels,
  aspectRatio: Pixels,
  centerRelativePositionX: Pixels,
  centerRelativePositionY: Pixels,
  maxWidth: Pixels,
  maxHeight: Pixels
): Rect {
  let width = 0,
    height = 0;

  // Left
  width = centerX / centerRelativePositionX;
  height = width / aspectRatio;
  // Top
  if (height > centerY / centerRelativePositionY) {
    height = centerY / centerRelativePositionY;
    width = height * aspectRatio;
  }
  // Right
  if (width > (maxWidth - centerX) / (1 - centerRelativePositionX)) {
    width = (maxWidth - centerX) / (1 - centerRelativePositionX);
    height = width / aspectRatio;
  }
  // Bottom
  if (height > (maxHeight - centerY) / (1 - centerRelativePositionY)) {
    height = (maxHeight - centerY) / (1 - centerRelativePositionY);
    width = height * aspectRatio;
  }

  return {
    left: centerX - width * centerRelativePositionX,
    right: centerX + width * (1 - centerRelativePositionX),
    top: centerY - height * centerRelativePositionY,
    bottom: centerY + height * (1 - centerRelativePositionY)
  };
}

function cropScore(crop: CropPosition) {
  let score = 0;
  score += (crop.scores.isLargeEnough ? 1 : 0) * LARGE_ENOUGH_SCORE_WEIGHT;
  score += crop.scores.posPriority * PRIORITY_SCORE_WEIGHT;
  score += crop.scores.objectCropIntersection * OBJECT_VISIBILITY_SCORE_WEIGHT;
  score +=
    crop.scores.objectPosRectIntersection *
    OBJECT_POSITION_OVERLAP_SCORE_WEIGHT;
  return score;
}

export function fitObjectToRect(
  rect: Rect,
  object: DetectedObject,
  size: SizeFormat,
  grid: Grid,
  imageSize: ImageSize
): CropPosition {
  let vpWidthSansMargin = getWidthSansMargin(size, grid);
  let vpHeightSansMargin = getHeightSansMargin(size, grid);

  let layoutAspectRatio = size.width / size.height;
  let layoutAspectRatioSansMargin = vpWidthSansMargin / vpHeightSansMargin;

  let objWidth = object.right - object.left;
  let objHeight = object.bottom - object.top;
  let [objFocalX, objFocalY] = object.focalPoint;

  // Where does the rect lie within the layout in relative terms?
  let rectRelativeCoordinates = getRectRelativePosition(rect, grid, size);

  // What is the aspect ratio, in grid units, of the rectangle we're fitting the object into?
  let rectGridUnitAspectRatio =
    (rect.right - rect.left) / (rect.bottom - rect.top);

  // What is the physical aspect ratio of that rect in the layout? (when the grid is projected into the layout)
  let rectPixelAspectRatio =
    rectGridUnitAspectRatio * layoutAspectRatioSansMargin;

  // How big is the rectangle of this aspect ratio that is big enough to contain the object?
  let enclosingRectSize = calculateEnclosingRectangle(
    objWidth,
    objHeight,
    rectPixelAspectRatio
  );

  // What are the pixel coordinates of the rectangle we've just found, which is the right size and aspect ratio?
  // Found by centering it on the object focal point in the original image.
  let rectLeft = objFocalX - enclosingRectSize.width / 2;
  let rectRight = objFocalX + enclosingRectSize.width / 2;
  let rectTop = objFocalY - enclosingRectSize.height / 2;
  let rectBottom = objFocalY + enclosingRectSize.height / 2;

  // How large is each horizontal and vertical grid unit in the layout grid that we create
  // by fitting the enclosing pixel rectangle we've found into the grid rectangle?
  let unitWidth = enclosingRectSize.width / getRectWidthUnits(rect, grid);
  let unitHeight = enclosingRectSize.height / getRectHeightUnits(rect, grid);

  // What are the pixel coordinates of the full layout without margins, when we project it
  // out based on the pixel location of the object rect, its coordinates in pixel units, and
  // the size of each pixel unit?
  let leftSansMargin = rectLeft - unitWidth * getRectLeftUnits(rect, grid);
  let rightSansMargin = rectRight + unitWidth * getRectRightUnits(rect, grid);
  let topSansMargin = rectTop - unitHeight * getRectTopUnits(rect, grid);
  let bottomSansMargin =
    rectBottom + unitHeight * getGridBottomUnits(rect, grid);

  // What should the ratio of each margin to the full size of the grid be?
  let horizontalMarginRatio = grid.horizontalMargin / size.width;
  let verticalMarginRatio = grid.verticalMargin / size.height;

  // What are the pixel sizes of the margins, based on the layout pixel size and margin ratios?
  let widthSansMargin = rightSansMargin - leftSansMargin;
  let heightSansMargin = bottomSansMargin - topSansMargin;
  let horizontalMarginPx = horizontalMarginRatio * widthSansMargin;
  let verticalMarginPx = verticalMarginRatio * heightSansMargin;

  // What is the full layout size in pixels, including margins?
  let fullRectLeft = leftSansMargin - horizontalMarginPx;
  let fullRectRight = rightSansMargin + horizontalMarginPx;
  let fullRectTop = topSansMargin - verticalMarginPx;
  let fullRectBottom = bottomSansMargin + verticalMarginPx;

  // Does this full layout fit within the bounds of the image?
  if (
    fullRectLeft < 0 ||
    fullRectRight > imageSize.width ||
    fullRectTop < 0 ||
    fullRectBottom > imageSize.height
  ) {
    // If not, try a purely focal-point based strategy:

    // If we put the focal point in the middle of this rect, where does it lie
    // in relative coordinates?
    let relFocalPointX =
      rectRelativeCoordinates.left +
      (rectRelativeCoordinates.right - rectRelativeCoordinates.left) / 2;
    let relFocalPointY =
      rectRelativeCoordinates.top +
      (rectRelativeCoordinates.bottom - rectRelativeCoordinates.top) / 2;

    // Find the largest rectangle that centers the focal point at this point,
    // and that doesn't overflow.
    let focalPointRect = findLargestRectangle(
      objFocalX,
      objFocalY,
      layoutAspectRatio,
      relFocalPointX,
      relFocalPointY,
      imageSize.width,
      imageSize.height
    );
    fullRectLeft = focalPointRect.left;
    fullRectRight = focalPointRect.right;
    fullRectTop = focalPointRect.top;
    fullRectBottom = focalPointRect.bottom;
  }

  // Round the size coordinates to integers
  fullRectLeft = Math.round(fullRectLeft);
  fullRectRight = Math.round(fullRectRight);
  fullRectTop = Math.round(fullRectTop);
  fullRectBottom = Math.round(
    fullRectTop + (fullRectRight - fullRectLeft) / layoutAspectRatio
  );

  // Calculate the scores of this crop - based on whether it's larger than the
  // given minimum size, and then on how much of the object we were able to fit
  // where we wanted
  let fullRectWidth = fullRectRight - fullRectLeft;
  let fullRectHeight = fullRectBottom - fullRectTop;
  let isLargeEnough =
    fullRectWidth >= size.width && fullRectHeight >= size.height;
  let objectSize = (object.right - object.left) * (object.bottom - object.top);
  let posRect = {
    left: rectRelativeCoordinates.left * (fullRectRight - fullRectLeft),
    right: rectRelativeCoordinates.right * (fullRectRight - fullRectLeft),
    top: rectRelativeCoordinates.top * (fullRectBottom - fullRectTop),
    bottom: rectRelativeCoordinates.bottom * (fullRectBottom - fullRectTop)
  };
  let fullRect = {
    left: fullRectLeft,
    right: fullRectRight,
    top: fullRectTop,
    bottom: fullRectBottom
  };
  let objectCropIntersectionSize = intersectRect(object, fullRect);
  let objectCropIntersection = objectCropIntersectionSize / objectSize;
  let objectPosRectIntersectionSize = intersectRect(object, posRect);
  let objectPosRectIntersection = objectPosRectIntersectionSize / objectSize;

  let crop: CropPosition = {
    ...fullRect,
    object,
    cropBasis: rectRelativeCoordinates,
    size,
    grid,
    width: size.width,
    height: size.height,
    scores: {
      isLargeEnough,
      objectCropIntersection,
      objectPosRectIntersection,
      posPriority: rect.priority
    }
  };
  return {
    ...crop,
    score: cropScore(crop)
  };
}
