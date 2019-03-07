import * as opentype from 'opentype.js';
import * as _ from 'lodash';

import { FontFamily, TextHeadingLevel, TextStyle } from '../index';
import { FONTS } from '../fonts';

let loadedFonts = new Map();

export function loadFont(fontKey: FontFamily): Promise<opentype.Font> {
  if (loadedFonts.has(fontKey)) {
    return Promise.resolve(getPreloadedFont(fontKey));
  }
  return new Promise((res, rej) => {
    opentype.load(_.find(FONTS, { key: fontKey }).url, (err, font) => {
      if (err) {
        rej(err);
      } else {
        loadedFonts.set(fontKey, font);
        res(font);
      }
    });
  });
}

export function getPreloadedFont(fontKey: FontFamily): opentype.Font {
  if (loadedFonts.has(fontKey)) {
    return loadedFonts.get(fontKey);
  } else {
    throw new Error(
      'Attempted to get preloaded font that has not been loaded: ' + fontKey
    );
  }
}

export function loadFontsForStyles(
  styles: { [l in TextHeadingLevel]?: TextStyle }
): Promise<{ [l in TextHeadingLevel]?: opentype.Font }> {
  let levels = _.keys(styles) as TextHeadingLevel[];
  return Promise.all(levels.map(level => loadFont(styles[level].fontFamily)))
    .then(fonts => fonts.map((font, idx) => [levels[idx], font]))
    .then(_.fromPairs);
}
