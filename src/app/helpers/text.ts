import * as _ from 'lodash';
import * as LRU from 'lru-cache';
import { string as smartquoteString } from 'smartquotes';

import {
  FontSize,
  Pixels,
  HorizontalAlignment,
  TextHeadingLevel,
  TextContent
} from '../index';

export interface PlacedText {
  height: Pixels;
  lines: Line[];
  isValid: boolean;
}

export interface Line {
  y: Pixels;
  glyphs: Glyph[];
  fontSize: Pixels;
  level: TextHeadingLevel;
}

export interface Glyph {
  x: Pixels;
  width: Pixels;
  glyph: opentype.Glyph;
}

export function isEmpty(text: TextContent[]) {
  return _.every(text, isEmptyTextContent);
}
export function isEmptyTextContent(t: TextContent) {
  return _.isArray(t.text)
    ? _.every(t.text, segment => _.isEmpty(_.trim(segment)))
    : _.isEmpty(_.trim(t.text));
}

function measureSegment(
  str: string,
  font: opentype.Font,
  fontSize: Pixels,
  letterSpacing: Pixels
) {
  let glyphs = font.stringToGlyphs(str);
  let fontScale = (1 / font.unitsPerEm) * fontSize;
  let spacingEm = letterSpacing * fontSize,
    result = [],
    x = 0;
  for (let i = 0; i < glyphs.length; i++) {
    let glyph = glyphs[i];
    let widthChar = glyph.advanceWidth * fontScale;
    result.push({
      glyph,
      x,
      width: widthChar
    });
    if (i < glyphs.length - 1) {
      let nextGlyph = glyphs[i + 1];
      let kerningValue = font.getKerningValue(glyph, nextGlyph);
      let kerningDiff = (widthChar + kerningValue * fontScale) / widthChar;
      x += widthChar + kerningValue * fontScale + spacingEm * kerningDiff;
    } else {
      x += widthChar + spacingEm;
    }
  }
  return result;
}

function alignX(line: Glyph[], width: Pixels, alignment: HorizontalAlignment) {
  let diff = 0;
  let textWidth = _.last(line).x + _.last(line).width;
  if (alignment === 'center') {
    diff = (width - textWidth) / 2;
  } else if (alignment === 'right') {
    diff = width - textWidth;
  }
  return line.map(s => ({ ...s, x: s.x + diff }));
}

// Line breaking algorithm based on https://xxyxyz.org/line-breaking/
function divideText(
  font: opentype.Font,
  text: string[],
  fontSize: { textSize: number; scaledTextSize: number; leading: number },
  width: Pixels,
  letterSpacing: Pixels
) {
  let remainingText = _.clone(text);
  let count = remainingText.length;

  let offsets = [0];
  let segmentsSoFar = '';
  for (let segment of remainingText) {
    segmentsSoFar += (segmentsSoFar.length > 0 ? ' ' : '') + segment;
    let glyphs = measureSegment(
      segmentsSoFar,
      font,
      fontSize.scaledTextSize,
      letterSpacing
    );
    let width = _.last(glyphs).x + _.last(glyphs).width;
    offsets.push(width);
  }

  let minima = [0].concat(_.times(count, () => 10 ** 20));
  let breaks = _.times(count + 1, () => 0);

  function cost(i: number, j: number) {
    let w = offsets[j] - offsets[i] + j - i - 1;
    if (w > width) {
      return 10 ** 10;
    }
    return minima[i] + (width - w) ** 2;
  }

  function search(i0: number, j0: number, i1: number, j1: number) {
    let stack = [[i0, j0, i1, j1]];
    while (stack.length) {
      let [i0, j0, i1, j1] = stack.pop();
      if (j0 < j1) {
        let j = Math.floor((j0 + j1) / 2);
        for (let i of _.range(i0, i1)) {
          let c = cost(i, j);
          if (c <= minima[j]) {
            minima[j] = c;
            breaks[j] = i;
          }
        }
        stack.push([breaks[j], j + 1, i1, j1]);
        stack.push([i0, j0, breaks[j] + 1, j]);
      }
    }
  }

  let n = count + 1;
  let i = 0;
  let offset = 0;
  while (true) {
    let r = Math.min(n, 2 ** (i + 1));
    let edge = 2 ** i + offset;
    search(0 + offset, edge, edge, r + offset);
    let x = minima[r - 1 + offset];
    let breaked = false;
    for (let j of _.range(2 ** i, r - 1)) {
      let y = cost(j + offset, r - 1 + offset);
      if (y <= x) {
        n -= j;
        i = 0;
        offset += j;
        breaked = true;
        break;
      }
    }
    if (!breaked) {
      if (r === n) {
        break;
      }
      i = i + 1;
    }
  }

  let lines = [];
  let j = count;
  while (j > 0) {
    i = breaks[j];
    let segments = remainingText.slice(i, j);
    let text = segments.join(' ');
    lines.push({
      text,
      glyphs: measureSegment(text, font, fontSize.scaledTextSize, letterSpacing)
    });
    j = i;
  }
  lines.reverse();
  return lines;
}

function wrapLines(
  fonts: { [level in TextHeadingLevel]?: opentype.Font },
  texts: { level: TextHeadingLevel; text: string[] }[],
  fontSizes: {
    [level in TextHeadingLevel]?: {
      textSize: number;
      scaledTextSize: number;
      leading: number;
      levelSpacing?: number;
    }
  },
  letterSpacings: { [level in TextHeadingLevel]?: Pixels },
  width: Pixels,
  alignment: HorizontalAlignment
): Line[] {
  let lines: {
    glyphs: Glyph[];
    fontSize: {
      textSize: number;
      scaledTextSize: number;
      leading: number;
      levelSpacing?: number;
    };
    level: TextHeadingLevel;
    lastOfLevel: boolean;
  }[] = [];
  for (let { text, level } of texts) {
    let fontSize = fontSizes[level];
    let font = fonts[level];
    let letterSpacing = letterSpacings[level] || 0;
    let textLines = divideText(font, text, fontSize, width, letterSpacing);
    lines = lines.concat(
      textLines.map((line, idx) => ({
        ...line,
        fontSize,
        level,
        lastOfLevel: idx === textLines.length - 1
      }))
    );
  }
  let result = [],
    y = 0;
  for (let i = 0; i < lines.length; i++) {
    y += lines[i].fontSize.textSize;
    let aligned = alignX(lines[i].glyphs, width, alignment);
    result.push({
      y,
      glyphs: aligned,
      fontSize: lines[i].fontSize.scaledTextSize,
      level: lines[i].level
    });
    y += lines[i].fontSize.leading;
    if (i > 0 && lines[i].lastOfLevel) {
      y += lines[i].fontSize.levelSpacing;
    }
  }
  return result;
}

function getLineLength(line: Line) {
  let firstSeg = _.first(line.glyphs);
  let lastSeg = _.last(line.glyphs);
  return lastSeg.x + lastSeg.width - firstSeg.x;
}

function getCapHeight(font: opentype.Font) {
  const chars = 'HIKLEFJMNTZBDPRAGOQSUVWXY';
  for (let a = 0, al = chars.length; a < al; a++) {
    let idx = font.charToGlyphIndex(chars[a]);
    if (idx <= 0) continue;
    return font.glyphs.get(idx).getMetrics().yMax;
  }
}

function scaleFontSizeForGrid(fontSize: number, font: opentype.Font) {
  let capHeight = getCapHeight(font);
  let scale = capHeight / font.unitsPerEm;
  return fontSize / scale;
}

function scaleFontSizesForGrid(
  sizes: { [level in TextHeadingLevel]?: FontSize },
  fonts: { [level in TextHeadingLevel]?: opentype.Font }
) {
  return _.fromPairs(
    _.map(sizes, (size, level: TextHeadingLevel) => [
      level,
      {
        ...size,
        scaledTextSize: scaleFontSizeForGrid(size.textSize, fonts[level])
      }
    ])
  );
}

export function placeText({
  text,
  fonts,
  fontSizes,
  maxHeight,
  width,
  textAlignment,
  letterSpacings,
  force
}: {
  fonts: { [level in TextHeadingLevel]?: opentype.Font };
  text: { level: TextHeadingLevel; text: string[] }[];
  fontSizes: { [level in TextHeadingLevel]?: FontSize }[];
  maxHeight: Pixels;
  width: Pixels;
  textAlignment: HorizontalAlignment;
  letterSpacings: { [level in TextHeadingLevel]?: Pixels };
  force: boolean;
}): PlacedText {
  let fontSizeOptions = _.reverse(
    _.sortBy(fontSizes, sizes => sizes['h1'].textSize)
  );
  for (let fontSizes of fontSizeOptions) {
    let scaledFontSizes = scaleFontSizesForGrid(fontSizes, fonts);
    let lines = isEmpty(text)
      ? []
      : wrapLines(
          fonts,
          text,
          scaledFontSizes,
          letterSpacings,
          width,
          textAlignment
        );
    let lastY = _.isEmpty(lines) ? 0 : _.last(lines).y;
    let lineLengths = lines.map(getLineLength);
    let maxLineLength = _.max(lineLengths);
    let isValid = lastY <= maxHeight && maxLineLength <= width;
    if (isValid || (force && fontSizes === _.last(fontSizeOptions))) {
      return {
        height: lastY,
        lines,
        isValid
      };
    }
  }
}

export function applySmartQuotes(text: string): string {
  return smartquoteString(text);
}
