import { SizeFormatGroup, FontSize, CSSColor } from './index';

export const MAX_ITEMS_TO_GENERATE_PER_COMBINATION = 25;

export const DEFAULT_FONT_SIZES: FontSize[] = [
  { textSize: 7, leading: 4 },
  { textSize: 6, leading: 3 },
  { textSize: 5, leading: 3 },
  { textSize: 4, leading: 2 },
  { textSize: 3, leading: 2 }
];
export const DEFAULT_LEVEL_SIZE_RATIO = 1 / 2; // Times larger size
export const DEFAULT_LEVEL_SPACING = 1.25; // Times line height

export const DEFAULT_TEXT_COLORS: CSSColor[] = ['#000000'];

export const PRESET_SIZES: SizeFormatGroup[] = [
  {
    name: 'Social',
    sizes: [
      {
        category: 'Facebook',
        name: 'Feed Image',
        width: 1800,
        height: 945,
        renderWidth: 1800,
        renderHeight: 945
      },
      {
        category: 'Facebook',
        name: 'Profile',
        width: 960,
        height: 960,
        renderWidth: 2048,
        renderHeight: 2048
      },
      {
        category: 'Facebook',
        name: 'Event Image',
        width: 1920,
        height: 1080,
        renderWidth: 1920,
        renderHeight: 1080
      },
      {
        category: 'Facebook',
        name: 'Cover Image',
        width: 851,
        height: 315,
        renderWidth: 1702,
        renderHeight: 630
      },
      {
        category: 'Instagram',
        name: 'Story',
        width: 1080,
        height: 1920,
        renderWidth: 1080,
        renderHeight: 1920
      },
      {
        category: 'Instagram',
        name: 'Square',
        width: 1080,
        height: 1080,
        renderWidth: 1936,
        renderHeight: 1936
      },
      {
        category: 'Twitter',
        name: 'Profile',
        width: 1000,
        height: 1000,
        renderWidth: 2000,
        renderHeight: 2000
      },
      {
        category: 'Twitter',
        name: 'Header',
        width: 1500,
        height: 500,
        renderWidth: 3000,
        renderHeight: 1000
      },
      {
        category: 'Twitter',
        name: 'In-Stream',
        width: 880,
        height: 440,
        renderWidth: 1760,
        renderHeight: 880
      },
      {
        category: 'Paper',
        name: 'A4 Portrait',
        width: 1240,
        height: 1754,
        renderWidth: 1240,
        renderHeight: 1754
      },
      {
        category: 'Paper',
        name: 'A4 Landscape',
        width: 1754,
        height: 1240,
        renderWidth: 1754,
        renderHeight: 1240
      },
      {
        category: 'Paper',
        name: 'US Letter Portrait',
        width: 1275,
        height: 1650,
        renderWidth: 1275,
        renderHeight: 1650
      },
      {
        category: 'Paper',
        name: 'US Letter Landscape',
        width: 1650,
        height: 1275,
        renderWidth: 1650,
        renderHeight: 1275
      },
      {
        category: 'Presentation',
        name: '16:9',
        width: 1920,
        height: 1080,
        renderWidth: 1920,
        renderHeight: 1080
      },
      {
        category: 'Presentation',
        name: '4:3',
        width: 1536,
        height: 1152,
        renderWidth: 1536,
        renderHeight: 1152
      }
    ]
  }
];
