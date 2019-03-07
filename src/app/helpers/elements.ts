import * as _ from 'lodash';

import {
  TextElement,
  Rect,
  TextStyle,
  Alignment,
  ContentBox,
  Grid,
  SizeFormat,
  ItemFrame,
  Pixels,
  BackgroundImageElement,
  DetectedObject,
  ForegroundImageElement,
  BackgroundColorElement,
  TextContent,
  FontSize,
  TextHeadingLevel
} from '../index';
import {
  PlacedText,
  placeText,
  Line,
  applySmartQuotes,
  isEmptyTextContent
} from './text';
import {
  DEFAULT_FONT_SIZES,
  DEFAULT_LEVEL_SIZE_RATIO,
  DEFAULT_LEVEL_SPACING
} from '../constants';
import { buildCanvas } from './canvas';
import { fitObjectToRect } from './crop';
import { loadImage } from './images';
import {
  getGridColumnWidth,
  getGridRowHeight,
  getRectWidthPixels,
  getRectHeighthPixels,
  getRectLeftPixels,
  getRectTopPixels
} from './grid';

export interface SetTextElementArgs {
  element: TextElement;
  rect: Rect;
  grid: Grid;
  size: SizeFormat;
  textStyles: { [level in TextHeadingLevel]?: TextStyle };
  textColorStyles: { [level in TextHeadingLevel]?: TextStyle };
  fonts: { [level in TextHeadingLevel]?: opentype.Font };
  extent: Rect;
  alignment: Alignment;
}
export interface SetTextElementResult extends TypeSetResult {
  element: TextElement;
  metadata: {};
  textStyles: { [level in TextHeadingLevel]?: TextStyle };
  textColorStyles: { [level in TextHeadingLevel]?: TextStyle };
  isValid: boolean;
}
export interface SetBackgroundImageElementArgs {
  element: BackgroundImageElement;
  rect: Rect;
  grid: Grid;
  size: SizeFormat;
  object?: DetectedObject;
  allObjects: DetectedObject[];
}
export interface SetBackroundImageElementResult extends ContentBox {
  element: BackgroundImageElement;
  crop: Rect;
  score: number;
  metadata: {};
  isValid: boolean;
  objectBounds: Rect;
  allProjectedObjects: DetectedObject[];
}
export interface SetForegroundImageElementArgs {
  element: ForegroundImageElement;
  rect: Rect;
  grid: Grid;
  size: SizeFormat;
  extent: Rect;
  alignment: Alignment;
}
export interface SetForegroundImageElementResult extends ContentBox {
  image: HTMLCanvasElement | ImageBitmap | HTMLImageElement;
  element: ForegroundImageElement;
  score: number;
  metadata: {};
  isValid: boolean;
}
export interface SetBackgroundColorElementArgs {
  element: BackgroundColorElement;
}
export interface SetBackgroundColorElementResult extends ContentBox {
  element: BackgroundColorElement;
  score: number;
  isValid: boolean;
  metadata: {};
}

interface TypeSetResult extends PlacedText, ContentBox {
  textAlignment: Alignment;
}

function prepText(text: string | string[], settings: TextStyle) {
  let arr = _.isArray(text)
    ? (<string[]>text).map(t => applySmartQuotes(t.trim()))
    : applySmartQuotes((<string>text).trim()).split(/\s+/);
  if (settings.isAllCaps) {
    return arr.map(t => t.toLocaleUpperCase());
  } else if (settings.isNoCaps) {
    return arr.map(t => t.toLocaleLowerCase());
  } else {
    return arr;
  }
}

let typeSetCache = new Map<string, PlacedText>();
function typeSet(
  grid: Grid,
  size: SizeFormat,
  rect: Rect,
  text: TextContent[],
  fonts: { [level in TextHeadingLevel]?: opentype.Font },
  textAlignment: Alignment,
  settings: { [level in TextHeadingLevel]?: TextStyle },
  force = false
): TypeSetResult {
  let cacheKey = JSON.stringify([
    settings,
    text,
    grid,
    size,
    rect,
    textAlignment,
    force
  ]);
  let placedText: PlacedText;
  if (typeSetCache.has(cacheKey)) {
    placedText = typeSetCache.get(cacheKey);
  } else {
    let textWidth = getRectWidthPixels(rect, grid, size);
    let textMaxHeight = getRectHeighthPixels(rect, grid, size);
    let fontSizes = buildFontSizes(
      settings,
      text,
      getGridRowHeight(grid, size)
    );
    placedText = placeText({
      text: text
        .map(({ text, level }) => ({
          text: prepText(text, settings[level]),
          level
        }))
        .filter(t => _.some(t.text, s => !_.isEmpty(s))),
      fonts,
      letterSpacings: _.fromPairs(
        _.map(settings, (style, level) => [level, style.letterSpacing])
      ),
      fontSizes,
      width: textWidth,
      textAlignment: textAlignment.horizontal,
      maxHeight: textMaxHeight,
      force
    });
    typeSetCache.set(cacheKey, placedText);
  }

  if (!placedText) {
    // Could not find fit, skip.
    return null;
  }

  // Situate the text coordinates into the bigger viewport
  let textLeft = getRectLeftPixels(rect, grid, size);
  let textTop = getRectTopPixels(rect, grid, size);
  if (textAlignment.vertical === 'middle') {
    textTop += (getRectHeighthPixels(rect, grid, size) - placedText.height) / 2;
  } else if (textAlignment.vertical === 'bottom') {
    textTop += getRectHeighthPixels(rect, grid, size) - placedText.height;
  }
  let placedLines = placedText.lines.map(line => ({
    ...line,
    y: line.y + textTop,
    glyphs: line.glyphs.map(glyph => ({
      ...glyph,
      x: glyph.x + textLeft
    }))
  }));
  return {
    ...placedText,
    lines: placedLines,
    textAlignment,
    contentLeft: _.round(
      _.min(placedLines.map(line => _.first(line.glyphs).x))
    ),
    contentTop: _.round(textTop),
    contentHeight: _.round(placedText.height),
    contentWidth: _.round(
      _.max(
        placedLines.map(
          line =>
            _.last(line.glyphs).x +
            _.last(line.glyphs).width -
            _.first(line.glyphs).x
        )
      )
    )
  };
}

function buildFontSizes(
  settings: { [level in TextHeadingLevel]?: TextStyle },
  text: TextContent[],
  gridItemHeight: Pixels
): { [level in TextHeadingLevel]?: FontSize }[] {
  // For each font size on the top heading level's typographic scale, find suitable
  // sizes each of the lower text levels, using the text settings of each respective level.
  let levels = _.uniq(text.map(t => t.level)).sort();
  let primaryTypographicScale =
    settings[levels[0]].fontSizes || DEFAULT_FONT_SIZES;
  let fontGridSizes = primaryTypographicScale.map(fontSize => {
    let sizes = {} as { [level in TextHeadingLevel]?: FontSize },
      lastLevelSizeRatio;
    for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
      let level = levels[levelIdx];
      let style = settings[level];
      let typographicScale = style.fontSizes || DEFAULT_FONT_SIZES;
      if (levelIdx === 0) {
        sizes[level] = fontSize;
        lastLevelSizeRatio = style.levelSizeRatio || DEFAULT_LEVEL_SIZE_RATIO;
      } else {
        let preferredTextSize = Math.max(
          1,
          Math.round(sizes[levels[levelIdx - 1]].textSize * lastLevelSizeRatio)
        );
        let closestFontSize = _.minBy(typographicScale, fontSize =>
          Math.abs(preferredTextSize - fontSize.textSize)
        );
        sizes[level] = closestFontSize;
        lastLevelSizeRatio = style.levelSizeRatio || DEFAULT_LEVEL_SIZE_RATIO;
      }
    }
    return sizes;
  });
  return fontGridSizes
    .filter(sizes => _.size(sizes) === _.uniq(_.values(sizes)).length) // Disregard combinations where the same size was used more than once
    .map(sizes => {
      let lastLevelSpacingRatio: number;
      return _.fromPairs(
        _.map(sizes, (size, level: TextHeadingLevel) => {
          let style = settings[level];
          let nextLevelSpacingRatio =
            style.levelSpacingRatio || DEFAULT_LEVEL_SPACING;
          let levelSpacingRatio =
            lastLevelSpacingRatio || nextLevelSpacingRatio;
          lastLevelSpacingRatio = nextLevelSpacingRatio;
          return [
            level,
            {
              textSize: size.textSize * gridItemHeight,
              leading: size.leading * gridItemHeight,
              levelSpacing:
                (size.textSize + size.leading) *
                (levelSpacingRatio - 1) *
                gridItemHeight
            }
          ];
        })
      );
    });
}

export function setTextElement({
  element,
  rect,
  grid,
  size,
  textStyles,
  textColorStyles,
  fonts,
  alignment
}: SetTextElementArgs): SetTextElementResult {
  let placedText = typeSet(
    grid,
    size,
    rect,
    element.content.filter(t => !isEmptyTextContent(t)),
    fonts,
    alignment,
    textStyles,
    true
  );

  let validPlacement = true;
  if (alignment.horizontal === 'center') {
    validPlacement = placedText.lines.length < 4;
  }
  return {
    ...placedText,
    element,
    textStyles,
    textColorStyles,
    metadata: { rect },
    isValid: placedText.isValid && validPlacement
  };
}

function applyGlyphs(
  line: Line,
  renderSizeRatio: number,
  renderFontSize: number,
  resCtx: CanvasRenderingContext2D
) {
  for (let glyph of line.glyphs) {
    let path = glyph.glyph.getPath(
      glyph.x * renderSizeRatio,
      line.y * renderSizeRatio,
      renderFontSize
    );
    for (let cmd of path.commands) {
      switch (cmd.type) {
        case 'M':
          resCtx.moveTo(cmd.x, cmd.y);
          break;
        case 'L':
          resCtx.lineTo(cmd.x, cmd.y);
          break;
        case 'C':
          resCtx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
          break;
        case 'Q':
          resCtx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
          break;
      }
    }
  }
}

function applyTextMask(
  resCtx: CanvasRenderingContext2D,
  textMask: ImageBitmap | HTMLCanvasElement,
  size: SizeFormat
) {
  let fillAspectRatio = textMask.width / textMask.height,
    fillWidth = size.renderWidth,
    fillHeight = fillWidth / fillAspectRatio;
  if (fillHeight < size.renderHeight) {
    fillHeight = size.renderHeight;
    fillWidth = fillHeight * fillAspectRatio;
  }
  let fillWidthDiff = fillWidth - size.renderWidth,
    fillHeightDiff = fillHeight - size.renderHeight;

  resCtx.drawImage(
    textMask,
    0,
    0,
    textMask.width,
    textMask.height,
    -fillWidthDiff / 2,
    -fillHeightDiff / 2,
    fillWidth,
    fillHeight
  );
}

function loadImageMasks(
  textColorStyles: { [l in TextHeadingLevel]?: TextStyle }
): Promise<{ [l in TextHeadingLevel]?: ImageBitmap | HTMLCanvasElement }> {
  return Promise.all(
    _.map(textColorStyles, (style, level: TextHeadingLevel) =>
      style.textMaskUrl
        ? loadImage(style.textMaskUrl).then(mask => [level, mask])
        : Promise.resolve([level, null])
    )
  ).then(_.fromPairs);
}
export function drawTextElement(
  placedText: SetTextElementResult,
  size: SizeFormat,
  underlyingFrames: ItemFrame[]
): Promise<HTMLCanvasElement> {
  let resCanvas = buildCanvas(size.renderWidth, size.renderHeight);
  let resCtx = resCanvas.getContext('2d');

  let { lines, textStyles, textColorStyles } = placedText;

  let renderSizeRatio = size.renderWidth / size.width;

  return loadImageMasks(textColorStyles).then(masks => {
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let renderFontSize = line.fontSize * renderSizeRatio;
      let textSettings = textStyles[line.level];
      let colorSettings = textColorStyles[line.level];

      let shadowSettings = colorSettings.shadowColor
        ? colorSettings
        : textSettings;

      resCtx.save();
      resCtx.beginPath();
      applyGlyphs(line, renderSizeRatio, renderFontSize, resCtx);

      if (colorSettings.textColors) {
        resCtx.fillStyle = colorSettings.textColors[0];
      }
      if (shadowSettings.shadowColor) {
        resCtx.shadowColor = shadowSettings.shadowColor;
        resCtx.shadowOffsetX =
          shadowSettings.shadowOffsetX * renderFontSize || 0;
        resCtx.shadowOffsetY =
          shadowSettings.shadowOffsetY * renderFontSize || 0;
        resCtx.shadowBlur = shadowSettings.shadowBlur * renderFontSize;
        if (shadowSettings.flipShadowTextColor && colorSettings.textColors) {
          resCtx.fillStyle = shadowSettings.shadowColor;
          resCtx.shadowColor = colorSettings.textColors[0];
        }
      } else {
        resCtx.shadowColor = null;
      }
      if (masks[line.level]) {
        resCtx.clip();
        applyTextMask(resCtx, masks['h1'], size);
      } else {
        resCtx.fill();
      }
      resCtx.restore();
    }
    return resCanvas;
  });
}

export function setBackgroundImageElement({
  element,
  grid,
  size,
  object,
  allObjects,
  rect
}: SetBackgroundImageElementArgs): SetBackroundImageElementResult {
  if (object && rect) {
    let candidate = fitObjectToRect(
      { ...rect, priority: 1 },
      object,
      size,
      grid,
      element.originalSize
    );
    let objectBounds = {
      left: object.left - candidate.left,
      right: object.right - candidate.left,
      top: object.top - candidate.top,
      bottom: object.bottom - candidate.top
    };
    let objectInCrop = {
      left: Math.max(0, objectBounds.left),
      right: Math.min(objectBounds.right, candidate.right),
      top: Math.max(0, objectBounds.top),
      bottom: Math.min(objectBounds.bottom, candidate.bottom)
    };
    let cropToViewportRatio = (candidate.right - candidate.left) / size.width;
    let projectedObject = {
      left: objectInCrop.left / cropToViewportRatio,
      right: objectInCrop.right / cropToViewportRatio,
      top: objectInCrop.top / cropToViewportRatio,
      bottom: objectInCrop.bottom / cropToViewportRatio
    };
    let projectedObjectBounds = {
      left: objectBounds.left / cropToViewportRatio,
      right: objectBounds.right / cropToViewportRatio,
      top: objectBounds.top / cropToViewportRatio,
      bottom: objectBounds.bottom / cropToViewportRatio
    };
    let allProjectedObjects = allObjects.map(object => ({
      ...object,
      left: (object.left - candidate.left) / cropToViewportRatio,
      top: (object.top - candidate.top) / cropToViewportRatio,
      right: (object.right - candidate.left) / cropToViewportRatio,
      bottom: (object.bottom - candidate.top) / cropToViewportRatio
    }));
    return {
      crop: candidate,
      contentLeft: projectedObject.left,
      contentWidth: projectedObject.right - projectedObject.left,
      contentTop: projectedObject.top,
      contentHeight: projectedObject.bottom - projectedObject.top,
      objectBounds: projectedObjectBounds,
      element,
      score: candidate.score,
      allProjectedObjects,
      metadata: { crop: candidate },
      isValid: true
    };
  } else {
    let sizeAspectRatio = size.width / size.height;
    let imageAspectRatio =
      element.originalSize.width / element.originalSize.height;
    let width, height;
    if (sizeAspectRatio > imageAspectRatio) {
      width = element.originalSize.width;
      height = width / sizeAspectRatio;
    } else {
      height = element.originalSize.height;
      width = height * sizeAspectRatio;
    }
    let crop = { left: 0, right: width, top: 0, bottom: height };
    return {
      crop,
      contentLeft: 0,
      contentWidth: width,
      contentTop: 0,
      contentHeight: height,
      objectBounds: {
        left: 0,
        right: width,
        top: 0,
        bottom: height
      },
      element,
      score: 0,
      allProjectedObjects: allObjects,
      metadata: { crop },
      isValid: true
    };
  }
}

export function drawBackgroundImageElement(
  setBackground: { crop: Rect; element: BackgroundImageElement },
  size: SizeFormat
) {
  let resCanvas = buildCanvas(size.renderWidth, size.renderHeight);
  let resCtx = resCanvas.getContext('2d');
  let image = setBackground.element.image;
  resCtx.drawImage(
    image,
    setBackground.crop.left,
    setBackground.crop.top,
    setBackground.crop.right - setBackground.crop.left,
    setBackground.crop.bottom - setBackground.crop.top,
    0,
    0,
    size.renderWidth,
    size.renderHeight
  );
  return resCanvas;
}

export function setForegroundImageElement({
  element,
  rect,
  grid,
  size,
  alignment
}: SetForegroundImageElementArgs): SetForegroundImageElementResult {
  let image = element.image;

  let rectWidth = getRectWidthPixels(rect, grid, size);
  let rectHeight = getRectHeighthPixels(rect, grid, size);
  let rectLeft = getRectLeftPixels(rect, grid, size);
  let rectTop = getRectTopPixels(rect, grid, size);

  let boundingBoxAspectRatio = rectWidth / rectHeight;
  let imageAspectRatio =
    element.originalSize.width / element.originalSize.height;
  let width, height;
  if (boundingBoxAspectRatio > imageAspectRatio) {
    height = rectHeight;
    width = height * imageAspectRatio;
  } else {
    width = rectWidth;
    height = width / imageAspectRatio;
  }

  let maxWidth =
    2 * getGridColumnWidth(grid, size) * grid.unitsPerHorizontalModule;
  let maxHeight =
    2 * getGridRowHeight(grid, size) * grid.unitsPerVerticalModule;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / imageAspectRatio;
  }
  if (height > maxHeight) {
    height = maxHeight;
    width = height * imageAspectRatio;
  }

  if (alignment.horizontal === 'right') {
    rectLeft += rectWidth - width;
  } else if (alignment.horizontal === 'center') {
    rectLeft += (rectWidth - width) / 2;
  }
  if (alignment.vertical === 'bottom') {
    rectTop += rectHeight - height;
  } else if (alignment.vertical === 'middle') {
    rectTop += (rectHeight - height) / 2;
  }

  return {
    image,
    element,
    contentLeft: _.round(rectLeft, 1),
    contentTop: _.round(rectTop, 1),
    contentWidth: _.round(width, 1),
    contentHeight: _.round(height, 1),
    score: width * height,
    metadata: {},
    isValid: true
  };
}

export function drawForegroundImageElement(
  {
    image,
    contentLeft,
    contentTop,
    contentWidth,
    contentHeight
  }: SetForegroundImageElementResult,
  size: SizeFormat
) {
  let renderSizeRatio = size.renderWidth / size.width;
  let canvas = buildCanvas(size.renderWidth, size.renderHeight);
  let context = canvas.getContext('2d');
  context.drawImage(
    image,
    contentLeft * renderSizeRatio,
    contentTop * renderSizeRatio,
    contentWidth * renderSizeRatio,
    contentHeight * renderSizeRatio
  );
  return canvas;
}

export function setBackgroundColorElement({
  element
}: SetBackgroundColorElementArgs): SetBackgroundColorElementResult {
  return {
    element,
    score: 0,
    contentLeft: 0,
    contentWidth: 0,
    contentTop: 0,
    contentHeight: 0,
    isValid: true,
    metadata: {}
  };
}

export function drawBackgroundColorElement(
  setBackground: { element: BackgroundColorElement },
  size: SizeFormat
) {
  let resCanvas = buildCanvas(size.renderWidth, size.renderHeight);
  let resCtx = resCanvas.getContext('2d');
  let color = setBackground.element.color;

  resCtx.fillStyle = color;
  resCtx.fillRect(0, 0, resCanvas.width, resCanvas.height);

  return resCanvas;
}
