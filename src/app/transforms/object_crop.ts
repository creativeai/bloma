import * as _ from 'lodash';
import { findInFrames } from '../helpers/frames';
import { buildGrid } from '../helpers/grid';
import { fitObjectToRect } from '../helpers/crop';
import {
  SizeFormat,
  ActionItem,
  ObjectCropActionSettings,
  DetectedObject,
  ImageSize,
  Rect
} from '../index';

function generateGridPositions(size: SizeFormat): Rect[] {
  let aspectRatio = size.width / size.height;
  let isPortrait = aspectRatio < 1;
  let isLandscape = aspectRatio > 1;
  return [
    // Single thirds along edges
    { left: 0, right: 1, top: 0, bottom: 1, priority: 1 },
    { left: 1, right: 2, top: 0, bottom: 1, priority: 1 },
    { left: 2, right: 3, top: 0, bottom: 1, priority: 1 },
    { left: 2, right: 3, top: 1, bottom: 2, priority: 1 },
    { left: 2, right: 3, top: 2, bottom: 3, priority: 1 },
    { left: 1, right: 2, top: 2, bottom: 3, priority: 1 },
    { left: 0, right: 1, top: 2, bottom: 3, priority: 1 },
    { left: 0, right: 1, top: 1, bottom: 2, priority: 1 },

    // Two horizontal adjacent cells, top and bottom
    { left: 0, right: 2, top: 0, bottom: 1, priority: 1 },
    { left: 1, right: 3, top: 0, bottom: 1, priority: 1 },
    { left: 1, right: 3, top: 2, bottom: 3, priority: 1 },
    { left: 0, right: 2, top: 2, bottom: 3, priority: 1 },

    // Two vertical adjacent cells, left, and right
    { left: 0, right: 1, top: 1, bottom: 3, priority: 1 },
    { left: 0, right: 1, top: 0, bottom: 2, priority: 1 },
    { left: 2, right: 3, top: 1, bottom: 3, priority: 1 },
    { left: 2, right: 3, top: 0, bottom: 2, priority: 1 },

    // Full edges
    { left: 0, right: 3, top: 0, bottom: 1, priority: 0.8 },
    { left: 2, right: 3, top: 0, bottom: 3, priority: 0.8 },
    { left: 0, right: 3, top: 2, bottom: 3, priority: 0.8 },
    { left: 0, right: 1, top: 0, bottom: 3, priority: 0.8 },

    // 2x2 squares
    { left: 0, right: 2, top: 0, bottom: 2, priority: 0.6 },
    { left: 1, right: 3, top: 0, bottom: 2, priority: 0.6 },
    { left: 0, right: 2, top: 1, bottom: 3, priority: 0.6 },
    { left: 1, right: 3, top: 1, bottom: 3, priority: 0.6 },

    // Halves
    { left: 0, right: 1.5, top: 0, bottom: 3, priority: 0.4 },
    { left: 1.5, right: 3, top: 0, bottom: 3, priority: 0.4 },
    { left: 0, right: 3, top: 0, bottom: 1.5, priority: 0.4 },
    { left: 1.5, right: 3, top: 0, bottom: 3, priority: 0.4 },

    // Two full rows
    { left: 0, right: 3, top: 0, bottom: 2, priority: 0.3 },
    { left: 0, right: 3, top: 1, bottom: 3, priority: 0.3 },

    // Two vertical adjacent cells, center
    { left: 1, right: 2, top: 1, bottom: 3, priority: isPortrait ? 1 : 0.2 },
    { left: 1, right: 2, top: 0, bottom: 2, priority: isPortrait ? 1 : 0.2 },

    // Two horizontal adjacent cells, center
    { left: 1, right: 3, top: 1, bottom: 2, priority: isLandscape ? 1 : 0.2 },
    { left: 0, right: 2, top: 1, bottom: 2, priority: isLandscape ? 1 : 0.2 }
  ];
}

function buildPositionCandidates(
  object: DetectedObject,
  positions: Rect[],
  size: SizeFormat,
  imageSize: ImageSize
) {
  let grid = buildGrid(size);
  return positions.map(pos =>
    fitObjectToRect(pos, object, size, grid, imageSize)
  );
}

function findCrops(
  sizes: SizeFormat[],
  objects: DetectedObject[],
  originalSize: ImageSize,
  maxCropsPerSize: number
) {
  let object = _.first(_.reverse(_.sortBy(objects, 'importance', 'classProb')));
  let sizeGroups = sizes.map(size => {
    let gridPositions = generateGridPositions(size);
    let candidates = buildPositionCandidates(
      object,
      gridPositions,
      size,
      originalSize
    );
    return _.sortBy(candidates, c => -c.score);
  });
  return _.flatMap(sizeGroups, g => _.take(g, maxCropsPerSize));
}

export function objectCrop(
  item: ActionItem,
  settings: ObjectCropActionSettings,
  next: (item: ActionItem) => any
) {
  if (item === 'endOfBatch') {
    next(item);
  } else {
    let objects = <DetectedObject[]>findInFrames(item, 'metadata.objects');
    let sizes = <SizeFormat[]>findInFrames(item, 'metadata.sizes');
    let origSize = <ImageSize>findInFrames(item, 'elements.0.originalSize');
    let crops = findCrops(sizes, objects, origSize, settings.maxCropsPerSize);
    for (let crop of crops) {
      next({
        ...item,
        frames: [
          ...item.frames,
          {
            name: 'Crop',
            fromActionId: settings.actionId,
            metadata: {
              grid: crop.grid,
              size: crop.size,
              fileName: [crop.size.category, crop.size.name]
            }
          }
        ]
      });
    }
  }
}
