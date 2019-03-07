import parseColor from 'parse-color';
import * as _ from 'lodash';

import { intersectRect } from './geometry';
import { RGBAColor, CSSColor, Rect, Grid } from '../index';
import { gridUnitRectToGridModuleRect } from './grid';

interface ColorRect extends Rect {
  color: string;
}

export function getCommonColor(
  dominantColors: ColorRect[],
  rect: Rect,
  grid: Grid
) {
  let rectInModules = gridUnitRectToGridModuleRect(rect, grid);
  let colors = _.filter(
    dominantColors,
    cell => intersectRect(cell, rectInModules) > 0
  ).map(c => c.color);
  let colorGroups = _.groupBy(colors, _.identity);
  let commonColor = _.maxBy(_.toPairs(colorGroups), g => g[1].length)[0];
  let commonDominance = colorGroups[commonColor].length / colors.length;
  return [commonColor, commonDominance];
}

export function getColorLuminance(rgb: RGBAColor) {
  let relRgb = rgb.map(c => c / 255);
  let [normR, normG, normB] = relRgb.map(c =>
    c < 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * normR + 0.7152 * normG + 0.0722 * normB;
}

function colorToArray(color: RGBAColor | CSSColor): RGBAColor {
  return _.isArray(color) ? color : parseColor(color).rgba;
}

export function findMaxContrastColor(
  commonColor: RGBAColor,
  colors: CSSColor[]
): [RGBAColor, number] {
  let parsedColors = colors.map(colorToArray);
  let commonLumi = getColorLuminance(commonColor);
  let contrastRatios = _.map(parsedColors, color => {
    let colorLumi = getColorLuminance(color);
    let [darkerLumi, lighterLumi] = _.sortBy(
      [commonLumi, colorLumi],
      _.identity
    );
    let contrastRatio = (lighterLumi + 0.05) / (darkerLumi + 0.05);
    return contrastRatio;
  });
  let maxContrastRatio = _.max(contrastRatios);
  let maxIndex = contrastRatios.indexOf(maxContrastRatio);
  // Contrast ratios can range from 1-21 -> normalize to ~0-1
  // https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html
  let relContrastRatio = maxContrastRatio / 21;
  return [parsedColors[maxIndex], relContrastRatio];
}
