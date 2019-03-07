import * as _ from 'lodash';

import { Styles, StyleBundle, TextHeadingLevel } from './index';

import swatchBlackWhiteNoise from '../assets/swatch-bw-noise.png';
import swatchRedHalftone from '../assets/swatch-red-halftone.png';
import swatchSaturated from '../assets/swatch-saturated.png';
import swatchCyberBlue from '../assets/swatch-cyber-dark.png';
import swatchCyberPurple from '../assets/swatch-cyber-purple.png';
import swatchCyberGlitch from '../assets/swatch-cyber-glitch.png';

import halftoneOverlayRedPath from '../assets/halftone-overlay-red.png';
import holoPath from '../assets/holo_26.png';
import glitchPath from '../assets/overlay-glitch.png';

import basketballPlayerPath from '../assets/basketball-player-v2.jpg';
import dogPath from '../assets/matthew-henry-115712-unsplash.jpg';
import deejayPath from '../assets/austin-neill-247237-unsplash.jpg';
import { DEFAULT_FONT } from './fonts';
import { DEFAULT_TEXT_COLORS } from './constants';

const TEXT_HEADING_LEVELS: TextHeadingLevel[] = ['h1', 'h2'];

function forAllLevels<T>(style: T) {
  return _.fromPairs(
    TEXT_HEADING_LEVELS.map((level: TextHeadingLevel) => [level, style])
  ) as { [level in TextHeadingLevel]: T };
}

export const DEFAULT_TEXT_STYLE: Styles = {
  name: 'default',
  elementTypes: ['text'],
  text: forAllLevels({
    fontFamily: DEFAULT_FONT
  })
};

export const DEFAULT_TEXT_COLOR_STYLE: Styles = {
  name: 'default',
  elementTypes: ['text'],
  text: forAllLevels({
    textColors: DEFAULT_TEXT_COLORS
  })
};

export const DEFAULT_FILTER_STYLE: Styles = {
  name: 'default',
  elementTypes: ['background_image']
};

export const SPORTS_BRAND_TEXT_STYLES: Styles[] = [
  {
    name: 'poppinsExtraBold',
    elementTypes: ['text'],
    text: forAllLevels({
      fontFamily: 'poppinsExtraBoldRegular',
      letterSpacing: -0.0135,
      isAllCaps: true,
      fontSizes: [
        { textSize: 7, leading: 1 },
        { textSize: 6, leading: 1 },
        { textSize: 5, leading: 1 },
        { textSize: 4, leading: 1 },
        { textSize: 3, leading: 1 }
      ]
    })
  },
  {
    name: 'poppinsExtraBoldItalic',
    elementTypes: ['text'],
    text: forAllLevels({
      fontFamily: 'poppinsExtraBoldItalic',
      letterSpacing: -0.0135,
      isAllCaps: true,
      fontSizes: [
        { textSize: 7, leading: 1 },
        { textSize: 6, leading: 1 },
        { textSize: 5, leading: 1 },
        { textSize: 4, leading: 1 },
        { textSize: 3, leading: 1 }
      ]
    })
  },
  {
    name: 'poppinsBold',
    elementTypes: ['text'],
    text: forAllLevels({
      fontFamily: 'poppinsBold'
    })
  },
  {
    name: 'c6f729',
    elementTypes: ['text'],
    text: forAllLevels({
      textColors: ['#c6f729']
    })
  },
  {
    name: 'ffffff',
    elementTypes: ['text'],
    text: forAllLevels({
      textColors: ['#ffffff']
    })
  },
  {
    name: 'f8e71c',
    elementTypes: ['text'],
    text: forAllLevels({
      textColors: ['#f8e71c']
    })
  }
];

export const CYBER_TEXT_STYLES: Styles[] = [
  {
    name: 'oswaldHeavy',
    elementTypes: ['text'],
    text: forAllLevels({
      fontFamily: 'oswaldHeavy',
      //letterSpacing: -0.005,
      isAllCaps: true,
      fontSizes: [
        { textSize: 7, leading: 2 },
        { textSize: 6, leading: 2 },
        { textSize: 5, leading: 1 },
        { textSize: 4, leading: 1 },
        { textSize: 3, leading: 1 }
      ]
    })
  },
  {
    name: 'oswaldHeavynocaps',
    elementTypes: ['text'],
    text: forAllLevels({
      fontFamily: 'oswaldHeavy',
      fontSizes: [
        { textSize: 7, leading: 2 },
        { textSize: 6, leading: 2 },
        { textSize: 5, leading: 2 },
        { textSize: 4, leading: 1 },
        { textSize: 3, leading: 1 }
      ]
    })
  },
  {
    name: 'ffffff',
    elementTypes: ['text'],
    text: forAllLevels({
      textColors: ['#ffffff']
    })
  },
  {
    name: 'holo',
    elementTypes: ['text'],
    text: forAllLevels({
      textMaskUrl: holoPath
    })
  }
];

export const SPORTS_BRAND_COLOR_TREATMENTS: Styles[] = [
  {
    name: 'gradBlackWhiteNoise',
    tileImg: swatchBlackWhiteNoise,
    elementTypes: ['background_image'],
    gradientMap: {
      from: '#080706',
      to: '#fff9f2'
    },
    addNoise: {
      amount: 10
    }
  },
  {
    name: 'saturation',
    tileImg: swatchSaturated,
    elementTypes: ['background_image'],
    saturate: {
      amount: 30
    }
  },
  {
    name: 'red',
    tileImg: swatchRedHalftone,
    elementTypes: ['background_image'],
    colorBlend: {
      color: '#d0021b',
      compositeOperation: 'multiply'
    },
    imageBlend: {
      blendImageUrl: halftoneOverlayRedPath,
      anchor: 'center',
      compositeOperation: 'lighten'
    }
  }
];

export const CYBER_COLOR_TREATMENTS: Styles[] = [
  {
    name: 'blue',
    tileImg: swatchCyberBlue,
    elementTypes: ['background_image'],
    colorBlend: {
      color: 'rgba(8, 44, 228, 0.25)',
      compositeOperation: 'hard-light'
    },
    addNoise: {
      amount: 10
    }
  },
  {
    name: 'purple',
    tileImg: swatchCyberPurple,
    elementTypes: ['background_image'],
    colorBlend: {
      color: 'rgba(23, 0, 85, 0.5)',
      compositeOperation: 'hard-light'
    },
    addNoise: {
      amount: 10
    }
  },
  {
    name: 'glitch',
    tileImg: swatchCyberGlitch,
    elementTypes: ['background_image'],
    colorBlend: {
      color: 'rgba(0, 0, 0, 0.5)',
      compositeOperation: 'multiply'
    },
    imageBlend: {
      blendImageUrl: glitchPath,
      anchor: 'topLeft',
      compositeOperation: 'source-over'
    }
  }
];

export const DEMO_STYLE_BUNDLES: StyleBundle[] = [
  {
    name: 'Active',
    styles: SPORTS_BRAND_COLOR_TREATMENTS.concat(SPORTS_BRAND_TEXT_STYLES)
  },
  {
    name: 'Cyber',
    styles: CYBER_COLOR_TREATMENTS.concat(CYBER_TEXT_STYLES)
  }
];

export const DEMO_BACKGROUND_IMAGE_PRESETS = [
  basketballPlayerPath,
  dogPath,
  deejayPath
];
