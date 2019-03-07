import * as _ from 'lodash';

import { makeSerialExecutor } from '../helpers/async';
import {
  findInFrames,
  findElementById,
  findAllElements,
  getTextStyles,
  getTextColorStyles,
  getBackgroundColorStyles
} from '../helpers/frames';
import {
  generateCorners,
  generateRects,
  generateNonOverlappingRects,
  Point,
  Corners
} from '../helpers/wheel';
import { intersectRect, getRectArea } from '../helpers/geometry';
import { loadFont, loadFontsForStyles } from '../helpers/fonts';
import { imageToBitmapOrCanvas } from '../helpers/images';
import {
  ElementType,
  Item,
  Grid,
  SizeFormat,
  Rect,
  Alignment,
  HorizontalAlignment,
  VerticalAlignment,
  ApplyElementsSettings,
  ItemFrame,
  DetectedObject,
  Element,
  ActionItem,
  ContentBox,
  Styles,
  BackgroundImageElement,
  TextElement,
  TextHeadingLevel
} from '../index';
import {
  drawTextElement,
  SetTextElementResult,
  SetTextElementArgs,
  setTextElement,
  SetBackroundImageElementResult,
  SetBackgroundImageElementArgs,
  setBackgroundImageElement,
  drawBackgroundImageElement,
  SetForegroundImageElementArgs,
  setForegroundImageElement,
  SetForegroundImageElementResult,
  drawForegroundImageElement,
  SetBackgroundColorElementArgs,
  SetBackgroundColorElementResult,
  setBackgroundColorElement,
  drawBackgroundColorElement
} from '../helpers/elements';
import { MAX_ITEMS_TO_GENERATE_PER_COMBINATION } from '../constants';
import { buildGrid } from '../helpers/grid';
import {
  DEFAULT_TEXT_STYLE,
  DEFAULT_TEXT_COLOR_STYLE,
  DEFAULT_FILTER_STYLE
} from '../styles';

const ELEMENT_Z_ORDER: { [type in ElementType]: number } = {
  background_image: 0,
  background_color: 0,
  foreground_image: 1,
  text: 2
};

function chooseAlignment(
  extent: Rect,
  { left, right, top, bottom }: Rect
): Alignment {
  let horizMidPoint = left + (right - left) / 2;
  let vertMidPoint = top + (bottom - top) / 2;
  let horizontal: HorizontalAlignment, vertical: VerticalAlignment;
  if (horizMidPoint === extent.left + (extent.right - extent.left) / 2) {
    horizontal = 'center';
  } else if (horizMidPoint < extent.left + (extent.right - extent.left) / 2) {
    horizontal = 'left';
  } else {
    horizontal = 'right';
  }

  if (vertMidPoint === extent.top + (extent.bottom - extent.top) / 2) {
    vertical = 'middle';
  } else if (vertMidPoint < extent.top + (extent.bottom - extent.top) / 2) {
    vertical = 'top';
  } else {
    vertical = 'bottom';
  }

  return { horizontal, vertical };
}

type SetElementResult =
  | SetTextElementResult
  | SetForegroundImageElementResult
  | SetBackroundImageElementResult
  | SetBackgroundColorElementResult;

type SetElementArgs =
  | SetTextElementArgs
  | SetForegroundImageElementArgs
  | SetBackgroundImageElementArgs
  | SetBackgroundColorElementArgs;

function setElement(
  args: SetElementArgs,
  item: Item,
  extent: Rect,
  settings: ApplyElementsSettings
): SetElementResult {
  if (args.element.type === 'text') {
    return setTextElement({
      ...(<SetTextElementArgs>args),
      alignment: chooseAlignment(extent, (<SetTextElementArgs>args).rect),
      textStyles: getTextStyle(settings, item)
        ? getTextStyle(settings, item).text
        : {},
      textColorStyles: getTextColorStyle(settings, item)
        ? getTextColorStyle(settings, item).text
        : {}
    });
  } else if (args.element.type === 'foreground_image') {
    return setForegroundImageElement({
      ...(<SetForegroundImageElementArgs>args),
      alignment: chooseAlignment(
        extent,
        (<SetForegroundImageElementArgs>args).rect
      )
    });
  } else if (args.element.type === 'background_image') {
    return setBackgroundImageElement(args as SetBackgroundImageElementArgs);
  } else if (args.element.type === 'background_color') {
    return setBackgroundColorElement(<SetBackgroundColorElementArgs>args);
  } else {
    console.error('Unknown element type, cannot set', args.element);
  }
}

function drawElement(
  setElement: SetElementResult,
  size: SizeFormat,
  underlyingFrames: ItemFrame[]
) {
  if (setElement.element.type === 'text') {
    return drawTextElement(
      <SetTextElementResult>setElement,
      size,
      underlyingFrames
    ).then(imageToBitmapOrCanvas);
  } else if (setElement.element.type === 'foreground_image') {
    return imageToBitmapOrCanvas(
      drawForegroundImageElement(
        <SetForegroundImageElementResult>setElement,
        size
      )
    );
  } else if (setElement.element.type === 'background_image') {
    return imageToBitmapOrCanvas(
      drawBackgroundImageElement(
        <SetBackroundImageElementResult>setElement,
        size
      )
    );
  } else if (setElement.element.type === 'background_color') {
    return imageToBitmapOrCanvas(
      drawBackgroundColorElement(
        <SetBackgroundColorElementResult>setElement,
        size
      )
    );
  } else {
    console.error('Unknown element type, cannot set', setElement);
  }
}

function buildContentRect(setElement: ContentBox) {
  if (
    setElement.contentLeft &&
    setElement.contentTop &&
    setElement.contentWidth &&
    setElement.contentHeight
  ) {
    return {
      left: setElement.contentLeft,
      top: setElement.contentTop,
      right: setElement.contentLeft + setElement.contentWidth,
      bottom: setElement.contentTop + setElement.contentHeight
    };
  } else {
    return null;
  }
}

interface Placement {
  setElement: SetElementResult;
  rect: Rect;
  extent: Rect;
}
interface Placements {
  projectedExtent: Rect;
  placements: Placement[];
}

/**
 * Remove any placements where content may have ended up exactly in the same position
 * (regardless of being placed in different rect areas originally). This could be due
 * to typesetting or image placement rules. For each unique placement we're keeping
 * the one generated by the smallest overall area of the placement rects.
 */
function deduplicatePlacements(allPlacements: Placements[]): Placements[] {
  let getContentRect = (p: Placement) =>
    _.pick(
      p.setElement,
      'contentLeft',
      'contentTop',
      'contentWidth',
      'contentHeight'
    );
  let getPlacementSizes = (placements: Placements) => {
    let sum = 0;
    for (let placement of placements.placements) {
      if (
        placement.setElement.element.type === 'text' ||
        placement.setElement.element.type === 'foreground_image'
      ) {
        let width = placement.rect.right - placement.rect.left;
        let height = placement.rect.bottom - placement.rect.top;
        sum += width * height;
      }
    }
    return sum;
  };
  let groupedByContentRect = _.groupBy(
    allPlacements,
    ({ placements }: Placements) =>
      JSON.stringify(placements.map(getContentRect))
  );
  return _.values(groupedByContentRect).map(group =>
    _.minBy(group, p => getPlacementSizes(p))
  );
}

function getDominantElementScore(
  { placements }: Placements,
  hierarchy: string[]
) {
  if (_.isEmpty(hierarchy)) return 0;
  let largestId = _.first(hierarchy);
  let extent = _.first(placements).extent;
  let extentArea = getRectArea(extent);
  let largest = _.find(
    placements,
    (p: Placement) => p.setElement.element.id === largestId
  );
  let largestArea = getRectArea(largest.rect);
  return largestArea >= extentArea / 2 ? -1 : 0;
}

function getObjectWithinViewScore({ placements }: Placements) {
  let pSum = 0,
    pNum = 0;
  for (let placement of placements) {
    if (placement.setElement.element.type === 'background_image') {
      let res = placement.setElement as SetBackroundImageElementResult;
      let contentRect = res.objectBounds;
      let clippedContentRect = {
        left: res.contentLeft,
        right: res.contentLeft + res.contentWidth,
        top: res.contentTop,
        bottom: res.contentTop + res.contentHeight
      };
      let contentRectArea = getRectArea(contentRect);
      let intersectArea = intersectRect(contentRect, clippedContentRect);
      pSum += intersectArea / contentRectArea;
      pNum++;
    }
  }
  return pNum > 0 ? pSum / pNum : 1;
}

function getOverlapScore({ placements }: Placements) {
  if (placements.length < 2) return 1;
  let [{ setElement: primary }, { setElement: secondary }] = placements;
  let primaryRect = {
    left: primary.contentLeft,
    right: primary.contentLeft + primary.contentWidth,
    top: primary.contentTop,
    bottom: primary.contentTop + primary.contentHeight
  };
  let secondaryRect = {
    left: secondary.contentLeft,
    right: secondary.contentLeft + secondary.contentWidth,
    top: secondary.contentTop,
    bottom: secondary.contentTop + secondary.contentHeight
  };
  let intersection = intersectRect(primaryRect, secondaryRect);
  let relIntersection =
    intersection / (secondary.contentWidth * secondary.contentHeight);
  return 1 - relIntersection;
}

function getAvoidableObjectOverlapScore({ placements }: Placements) {
  let background = _.find(
    placements,
    p => p.setElement.element.type === 'background_image'
  );
  if (background) {
    let avoidableObjects = (background.setElement as SetBackroundImageElementResult).allProjectedObjects.filter(
      o => o.shouldAvoidOverlap
    );
    let foregrounds = placements.filter(
      p =>
        p.setElement.element.type === 'foreground_image' ||
        p.setElement.element.type === 'text'
    );
    let foregroundRects = foregrounds.map(foreground => ({
      left: foreground.setElement.contentLeft,
      top: foreground.setElement.contentTop,
      right:
        foreground.setElement.contentLeft + foreground.setElement.contentWidth,
      bottom:
        foreground.setElement.contentTop + foreground.setElement.contentHeight
    }));
    for (let foregroundRect of foregroundRects) {
      for (let avoidable of avoidableObjects) {
        let intersection = intersectRect(foregroundRect, avoidable);
        if (intersection > 0) {
          // There is an overlap with an avoidable object; penalize
          return 1;
        }
      }
    }
  }
  return -1;
}

function getHierarchyScore({ placements }: Placements, hierarchy: string[]) {
  let placementsByHierarchy = hierarchy.map(id =>
    _.find(placements, (p: Placement) => p.setElement.element.id === id)
  );
  let score = 0;
  for (let i = 0; i < placementsByHierarchy.length - 1; i++) {
    let larger = placementsByHierarchy[i];
    let smaller = placementsByHierarchy[i + 1];
    let largerSize =
      larger.setElement.contentWidth * larger.setElement.contentHeight;
    let smallerSize =
      smaller.setElement.contentWidth * smaller.setElement.contentHeight;
    let ratio = smallerSize / largerSize;
    score += ratio;
  }
  return score;
}

function getBestPlacements(
  allPlacements: Placements[],
  hierarchy: string[]
): Placements[] {
  let validPlacements = _.filter(
    allPlacements,
    (p: { projectedExtent: Rect; placements: Placement[] }) =>
      _.every(p.placements, (e: Placement) => e.setElement.isValid)
  );
  let sortedPlacements;
  if (validPlacements.length) {
    sortedPlacements = _.sortBy(
      validPlacements,
      (p: Placements) => getDominantElementScore(p, hierarchy), // By whether if dominant element is dominant enough
      (p: Placements) => getAvoidableObjectOverlapScore(p), // By whether foreground elements overlap with avoidable objects
      (p: Placements) => -getObjectWithinViewScore(p),
      (p: Placements) => -getOverlapScore(p), // Then the least (or no) overlap
      (p: Placements) => getHierarchyScore(p, hierarchy) // Settle ties by maximizing hierarchy
    );
  } else {
    // Fall back to invalid placements, doing what we can
    sortedPlacements = _.sortBy(
      allPlacements,
      (p: Placements) =>
        -_.filter(p.placements, (e: Placement) => e.setElement.isValid).length, // Most valid placements first
      (p: Placements) => getDominantElementScore(p, hierarchy), // Then by whether if dominant element is dominant enough
      (p: Placements) => getAvoidableObjectOverlapScore(p), // By whether foreground elements overlap with avoidable objects
      (p: Placements) => -getObjectWithinViewScore(p),
      (p: Placements) => -getOverlapScore(p), // Then the least (or no) overlap
      (p: Placements) => getHierarchyScore(p, hierarchy) // Settle ties by maximizing hierarchy
    );
  }
  let results = _.take(sortedPlacements, MAX_ITEMS_TO_GENERATE_PER_COMBINATION);
  return results;
}

function sortPlacedElementsForWheel(
  placedElements: Element[],
  hierarchy: string[]
): Element[] {
  let hierarchySort = (el: Element) =>
    hierarchy.indexOf(el.id) >= 0 ? hierarchy.indexOf(el.id) : 1000;
  let typeSort = (el: Element) => (el.type === 'background_image' ? 1 : 0);
  // In case there are more than 2 elements, drop background image off the wheel first,
  // and otherwise sort by hierarchy.
  return placedElements.length > 2
    ? _.sortBy(placedElements, typeSort, hierarchySort)
    : _.sortBy(placedElements, hierarchySort);
}

interface RectCombination {
  primary: { element: Element; rect: Rect };
  secondary?: { element: Element; rect: Rect };
  tertiary: { element: Element; rect: Rect }[];
}

function generateRectCombinations({
  primaryCorner,
  secondaryCorner,
  primaryElement,
  secondaryElement,
  tertiaryElements,
  extent,
  grid
}: {
  primaryCorner: Point;
  secondaryCorner: Point;
  primaryElement: Element;
  secondaryElement: Element;
  tertiaryElements: Element[];
  extent: Rect;
  grid: Grid;
}): RectCombination[] {
  let rectCombinations = [];
  for (let primary of generateRects(primaryCorner, extent, grid)) {
    if (secondaryElement) {
      for (let secondary of generateRects(secondaryCorner, extent, grid)) {
        let tertiary = tertiaryElements.map(() => {
          let rectOptions = generateNonOverlappingRects(extent, grid, [
            primary,
            secondary
          ]);
          return _.maxBy(rectOptions, getRectArea);
        });
        if (_.every(tertiary, _.identity)) {
          rectCombinations.push({
            primary: { element: primaryElement, rect: primary },
            secondary: { element: secondaryElement, rect: secondary },
            tertiary: tertiary.map((rect, idx) => ({
              element: tertiaryElements[idx],
              rect
            }))
          });
        }
      }
    } else {
      rectCombinations.push({
        primary: { element: primaryElement, rect: primary },
        tertiary: []
      });
    }
  }
  return rectCombinations;
}

function generatePlacementsForCorners(
  item: Item,
  size: SizeFormat,
  grid: Grid,
  { corners: [primaryCorner, secondaryCorner], extent }: Corners,
  placedElements: Element[],
  hierarchy: string[],
  settings: ApplyElementsSettings,
  fonts: { [level in TextHeadingLevel]?: opentype.Font }
): Placements[] {
  let [
    primaryElement,
    secondaryElement,
    ...tertiaryElements
  ] = sortPlacedElementsForWheel(placedElements, hierarchy);
  let projectedExtent = {
    left: extent.left * grid.unitsPerHorizontalModule,
    right: extent.right * grid.unitsPerHorizontalModule,
    top: extent.top * grid.unitsPerVerticalModule,
    bottom: extent.bottom * grid.unitsPerVerticalModule
  };
  let rectCombinations = generateRectCombinations({
    primaryCorner,
    secondaryCorner,
    primaryElement,
    secondaryElement,
    tertiaryElements,
    extent,
    grid
  });
  let object = <DetectedObject>_.first(findInFrames(item, 'metadata.objects'));
  let allObjects = <DetectedObject[]>findInFrames(item, 'metadata.allObjects');
  let placementsForCorner = [];
  for (let { primary, secondary, tertiary } of rectCombinations) {
    let placements = [];
    placements.push({
      rect: primary.rect,
      extent: projectedExtent,
      setElement: setElement(
        <SetElementArgs>{
          element: primaryElement,
          rect: primary.rect,
          grid,
          size,
          settings,
          fonts,
          extent: projectedExtent,
          object,
          allObjects
        },
        item,
        projectedExtent,
        settings
      )
    });
    if (secondary) {
      placements.push({
        rect: secondary.rect,
        extent: projectedExtent,
        setElement: setElement(
          <SetElementArgs>{
            element: secondaryElement,
            rect: secondary.rect,
            grid,
            size,
            settings,
            fonts,
            extent: projectedExtent,
            object,
            allObjects
          },
          item,
          projectedExtent,
          settings
        )
      });
    }
    for (let { element, rect } of tertiary) {
      placements.push({
        rect,
        extent: projectedExtent,
        setElement: setElement(
          <SetElementArgs>{
            element,
            rect,
            grid,
            size,
            settings,
            fonts,
            extent: projectedExtent,
            object,
            allObjects
          },
          item,
          projectedExtent,
          settings
        )
      });
    }
    placementsForCorner.push({ projectedExtent, placements });
  }
  return placementsForCorner;
}

function interleave<T>(a1: T[], a2: T[]): T[] {
  let result = [],
    l = Math.min(a1.length, a2.length);
  for (let i = 0; i < l; i++) {
    result.push(a1[i], a2[i]);
  }
  result.push(...a1.slice(l), ...a2.slice(l));
  return result;
}

function generatePlacements(
  item: Item,
  size: SizeFormat,
  grid: Grid,
  settings: ApplyElementsSettings,
  elements: Element[],
  fonts: { [level in TextHeadingLevel]?: opentype.Font }
) {
  let hierarchy =
    <string[]>findInFrames(item, 'metadata.elementHierarchy') || [];
  let allCorners = generateCorners(grid, elements);
  let results: { projectedExtent: Rect; placements: Placement[] }[] = [];
  for (let corners of allCorners) {
    results = interleave(
      results,
      generatePlacementsForCorners(
        item,
        size,
        grid,
        corners,
        elements,
        hierarchy,
        settings,
        fonts
      )
    );
  }
  return getBestPlacements(deduplicatePlacements(results), hierarchy);
}

function renderPlacements(
  item: Item,
  size: SizeFormat,
  grid: Grid,
  settings: ApplyElementsSettings,
  allPlacements: Placements[],
  backgroundElements: Element[]
): Promise<Item[]> {
  return Promise.all(
    allPlacements.map(({ placements, projectedExtent }) => {
      let setBackgrounds = backgroundElements.map(element => ({
        setElement: setElement(
          <SetElementArgs>{
            element,
            grid,
            size,
            settings,
            extent: projectedExtent
          },
          item,
          projectedExtent,
          settings
        )
      }));

      let allSetElements = _.sortBy(
        setBackgrounds.concat(placements),
        ({ setElement }: { setElement: SetElementResult }) =>
          ELEMENT_Z_ORDER[setElement.element.type]
      );

      let newFrames: ItemFrame[] = [];
      let framesDone: Promise<any> = Promise.resolve(true);
      for (let { setElement } of allSetElements) {
        framesDone = framesDone.then(() =>
          drawElement(setElement, size, newFrames).then(
            (layer: HTMLCanvasElement | ImageBitmap) => {
              newFrames.push({
                name: 'Element',
                fromActionId: settings.actionId,
                metadata: {
                  ...setElement.metadata,
                  appliedElementId: setElement.element.id,
                  appliedElementType: setElement.element.type,
                  contentRect: buildContentRect(setElement),
                  settings,
                  size,
                  grid,
                  textStyle: settings.selectedTextStyle,
                  textColor: settings.selectedTextColor,
                  filterStyle: settings.selectedFilterStyle,
                  fileName: [size.category, size.name]
                },
                layer
              });
            }
          )
        );
      }

      return framesDone.then(() => ({
        ...item,
        frames: [...item.frames, ...newFrames]
      }));
    })
  );
}

function collectElements(item: Item, settings: ApplyElementsSettings) {
  let allElements = _.flatMap(item.frames, f => f.elements || []);
  let result: Element[] = [];

  result = result.concat(allElements.filter(el => el.type === 'text'));
  result = result.concat(
    allElements.filter(el => el.type === 'foreground_image')
  );
  result = result.concat(
    allElements.filter(el => el.type === 'background_color')
  );
  if (getFilterStyle(settings, item)) {
    result = result.concat(
      allElements.filter(
        el =>
          el.type === 'background_image' &&
          _.some(el.appliedStyles, style =>
            _.isEqual(style.name, getFilterStyle(settings, item).name)
          )
      )
    );
  } else {
    result = result.concat(
      _.take(allElements.filter(el => el.type === 'background_image'), 1)
    );
  }
  return result;
}

function isPlacedElement(element: Element, item: Item) {
  return (
    element.type === 'text' ||
    element.type === 'foreground_image' ||
    (element.type === 'background_image' &&
      !_.isEmpty(findInFrames(item, 'metadata.objects')))
  );
}

export function applyElementsForItem(
  item: Item,
  settings: ApplyElementsSettings
): Promise<Item[]> {
  let size = settings.selectedSize;
  if (size) {
    let grid = buildGrid(size);
    return loadFontsForStyles(getTextStyle(settings, item).text).then(fonts => {
      let elements = collectElements(item, settings);
      let placedElements = elements.filter(e => isPlacedElement(e, item));
      let backgroundElements: Element[] = _.difference(
        elements,
        placedElements
      );
      let allPlacements = generatePlacements(
        item,
        size,
        grid,
        settings,
        placedElements,
        fonts
      );
      let placementsToRender = [];
      if (settings.resultOutput === 'sample') {
        placementsToRender = _.sampleSize(allPlacements, 1);
      } else if (settings.resultOutput === 'best') {
        placementsToRender = _.take(allPlacements, 1);
      } else {
        placementsToRender = _.shuffle(allPlacements);
      }
      return renderPlacements(
        item,
        size,
        grid,
        settings,
        placementsToRender,
        backgroundElements
      );
    });
  } else {
    return Promise.resolve([]);
  }
}

function getTextStyle(settings: ApplyElementsSettings, item: Item) {
  let selected = settings.selectedTextStyle;
  if (selected) {
    return selected;
  } else if (_.isEmpty(getTextStyles(item))) {
    return DEFAULT_TEXT_STYLE;
  } else {
    return null;
  }
}

function getTextColorStyle(settings: ApplyElementsSettings, item: Item) {
  let selected = settings.selectedTextColor;
  if (
    !selected &&
    settings.selectedFilterStyle &&
    settings.selectedFilterStyle.text
  ) {
    return settings.selectedFilterStyle;
  } else if (!selected && _.isEmpty(getTextColorStyles(item))) {
    return DEFAULT_TEXT_COLOR_STYLE;
  } else {
    return selected;
  }
}

function getFilterStyle(settings: ApplyElementsSettings, item: Item) {
  let selected = settings.selectedFilterStyle;
  if (selected) {
    return selected;
  } else if (_.isEmpty(getBackgroundColorStyles(item))) {
    return DEFAULT_FILTER_STYLE;
  }
}

let pending: Promise<any>[] = [];
let executor = makeSerialExecutor();

export function applyElements(
  item: ActionItem,
  settings: ApplyElementsSettings,
  next: (item: ActionItem) => any
) {
  if (item === 'endOfBatch') {
    Promise.all(pending).then(() => next('endOfBatch'));
    pending = [];
  } else {
    next(item); // Always feed original item so output panel can obtain metadata from it
    let textStyle = getTextStyle(settings, item);
    let textColorStyle = getTextColorStyle(settings, item);
    let filterStyle = getFilterStyle(settings, item);
    if (textStyle && textColorStyle && filterStyle) {
      pending.push(
        executor(() =>
          applyElementsForItem(item, settings).then(items => {
            items.forEach(next);
          })
        )
      );
    }
  }
}

export function rerenderElement(
  item: Item,
  frame: ItemFrame,
  newRect: Rect,
  alignment?: Alignment
): Promise<{
  contentRect?: Rect;
  layer?: HTMLCanvasElement;
  crop?: Rect;
  placedText?: SetTextElementResult;
}> {
  let textStyle = <Styles>findInFrames(item, 'metadata.textStyle');
  let textColorStyle = <Styles>findInFrames(item, 'metadata.textColor');
  let filterStyle = <Styles>findInFrames(item, 'metadata.filterStyle');
  let grid = <Grid>findInFrames(item, 'metadata.grid');
  let size = <SizeFormat>findInFrames(item, 'metadata.size');
  let element = findElementById(item, frame.metadata.appliedElementId);
  if (element.type === 'text') {
    let underlyingFrames = item.frames.filter(
      (f, idx) => f.layer && idx < item.frames.indexOf(frame)
    );
    let extent = { left: 0, right: grid.columns, top: 0, bottom: grid.rows };
    return loadFontsForStyles(textStyle.text)
      .then(fonts =>
        setTextElement({
          rect: newRect,
          element: element as TextElement,
          grid,
          size,
          textStyles: textStyle ? textStyle.text : {},
          textColorStyles: textColorStyle ? textColorStyle.text : {},
          fonts,
          extent,
          alignment: alignment || chooseAlignment(extent, newRect)
        })
      )
      .then(setText =>
        drawTextElement(setText, size, underlyingFrames).then(textCanvas => ({
          contentRect: newRect,
          placedText: setText,
          layer: textCanvas
        }))
      );
  } else if (element.type === 'foreground_image') {
    let imageCanvas = drawForegroundImageElement(
      {
        element,
        contentLeft: newRect.left,
        contentWidth: newRect.right - newRect.left,
        contentTop: newRect.top,
        contentHeight: newRect.bottom - newRect.top,
        image: element.image,
        score: null,
        metadata: {},
        isValid: true
      },
      size
    );
    return Promise.resolve({
      contentRect: newRect,
      layer: imageCanvas
    });
  } else if (element.type === 'background_image') {
    let allBackgroundImages = findAllElements(
      item,
      'background_image'
    ) as BackgroundImageElement[];
    let filterStyleName = filterStyle ? filterStyle.name : null;
    let elementVariant: BackgroundImageElement;
    if (filterStyleName) {
      elementVariant = _.find(allBackgroundImages, img =>
        _.some(img.appliedStyles, s => s.name === filterStyleName)
      );
    } else {
      elementVariant = _.find(allBackgroundImages, img =>
        _.isEmpty(img.appliedStyles)
      );
    }
    let bgCanvas = drawBackgroundImageElement(
      {
        element: elementVariant,
        crop: newRect
      },
      size
    );
    return Promise.resolve({
      layer: bgCanvas,
      crop: newRect
    });
  }
}
