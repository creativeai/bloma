import * as flatten from 'flat';
import * as _ from 'lodash';

import { makeSerialExecutor } from '../helpers/async';
import { findInFrames } from '../helpers/frames';
import {
  ActionItem,
  QuantizeKMeansActionSettings,
  Rect,
  Pixels,
  KMeansActionSettings,
  SizeFormat,
  Grid
} from '../index';
import { buildCanvas } from '../helpers/canvas';

const MAX_K_MEANS_PIXELS = 50000;

// Checks for equality of elements in two arrays.
var arrays_equal = function(
  a1: Array<any> | Uint8ClampedArray,
  a2: Array<any> | Uint8ClampedArray
) {
  if (a1.length !== a2.length) return false;
  for (var i = 0; i < a1.length; ++i) {
    if (a1[i] !== a2[i]) return false;
  }
  return true;
};

// Given width w and height h, rescale the dimensions to satisfy
// the specified number of pixels.
var rescale_dimensions = function(w: Pixels, h: Pixels, pixels: Pixels) {
  var aspect_ratio = w / h;
  var scaling_factor = Math.sqrt(pixels / aspect_ratio);
  var rescaled_w = Math.floor(aspect_ratio * scaling_factor);
  var rescaled_h = Math.floor(scaling_factor);
  return [rescaled_w, rescaled_h];
};

// Given an Image, return a dataset with pixel colors.
// If resized_pixels > 0, image will be resized prior to building
// the dataset.
// return: [[R,G,B,a], [R,G,B,a], [R,G,B,a], ...]
var get_pixel_dataset = function(
  img: HTMLImageElement | HTMLCanvasElement,
  resized_pixels: Pixels
) {
  if (resized_pixels === undefined) resized_pixels = -1;
  // Get pixel colors from a <canvas> with the image
  var img_n_pixels = img.width * img.height;
  var canvas_width = img.width;
  var canvas_height = img.height;
  if (resized_pixels > 0 && img_n_pixels > resized_pixels) {
    var rescaled = rescale_dimensions(img.width, img.height, resized_pixels);
    canvas_width = rescaled[0];
    canvas_height = rescaled[1];
  }
  var canvas = buildCanvas(canvas_width, canvas_height);
  var canvas_n_pixels = canvas_width * canvas_height;
  var context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, canvas_width, canvas_height);
  var flattened_dataset = context.getImageData(
    0,
    0,
    canvas_width,
    canvas_height
  ).data;
  var n_channels = flattened_dataset.length / canvas_n_pixels;
  var dataset = [];
  for (var i = 0; i < flattened_dataset.length; i += n_channels) {
    dataset.push(flattened_dataset.slice(i, i + n_channels));
  }
  return dataset;
};

// Given a point and a list of neighbor points, return the index
// for the neighbor that's closest to the point.
var nearest_neighbor = function(
  point: Uint8ClampedArray,
  neighbors: (Uint8ClampedArray | number[])[]
) {
  var best_dist = Infinity; // squared distance
  var best_index = -1;
  for (var i = 0; i < neighbors.length; ++i) {
    var neighbor = neighbors[i];
    var dist = 0;
    for (var j = 0; j < point.length; ++j) {
      dist += Math.pow(point[j] - neighbor[j], 2);
    }
    if (dist < best_dist) {
      best_dist = dist;
      best_index = i;
    }
  }
  return best_index;
};

// Returns the centroid of a dataset.
var centroid = function(dataset: Uint8ClampedArray[]) {
  if (dataset.length === 0) return [];
  // Calculate running means.
  var running_centroid = [];
  for (var i = 0; i < dataset[0].length; ++i) {
    running_centroid.push(0);
  }
  for (var i = 0; i < dataset.length; ++i) {
    var point = dataset[i];
    for (var j = 0; j < point.length; ++j) {
      running_centroid[j] += (point[j] - running_centroid[j]) / (i + 1);
    }
  }
  return running_centroid;
};

// Returns the k-means centroids.
var k_means = function(dataset: Uint8ClampedArray[], k: number) {
  if (k === undefined) k = Math.min(3, dataset.length);
  // Use a seeded random number generator instead of Math.random(),
  // so that k-means always produces the same centroids for the same
  // input.
  let rng_seed = 0;
  var random = function() {
    rng_seed = (rng_seed * 9301 + 49297) % 233280;
    return rng_seed / 233280;
  };
  // Choose initial centroids randomly.
  let centroids: (Uint8ClampedArray | number[])[] = [];
  for (var i = 0; i < k; ++i) {
    var idx = Math.floor(random() * dataset.length);
    centroids.push(dataset[idx]);
  }
  while (true) {
    // 'clusters' is an array of arrays. each sub-array corresponds to
    // a cluster, and has the points in that cluster.
    var clusters: Uint8ClampedArray[][] = [];
    for (var i = 0; i < k; ++i) {
      clusters.push([]);
    }
    for (var i = 0; i < dataset.length; ++i) {
      var point = dataset[i];
      var nearest_centroid = nearest_neighbor(point, centroids);
      clusters[nearest_centroid].push(point);
    }
    var converged = true;
    for (var i = 0; i < k; ++i) {
      var cluster = clusters[i];
      var centroid_i: Uint8ClampedArray | number[] = [];
      if (cluster.length > 0) {
        centroid_i = centroid(cluster);
      } else {
        // For an empty cluster, set a random point as the centroid.
        var idx = Math.floor(random() * dataset.length);
        centroid_i = dataset[idx];
      }
      converged = converged && arrays_equal(centroid_i, centroids[i]);
      centroids[i] = centroid_i;
    }
    if (converged) break;
  }
  return centroids;
};

// Takes an <img> as input. Returns a quantized canvas.
var quantize = function(
  img: HTMLImageElement | HTMLCanvasElement,
  centroids: (Uint8ClampedArray | number[])[]
) {
  var width = img.width;
  var height = img.height;

  var source_canvas = buildCanvas(width, height);
  var source_context = source_canvas.getContext('2d');
  source_context.drawImage(img, 0, 0, width, height);

  // flattened_*_data = [R, G, B, a, R, G, B, a, ...] where
  // (R, G, B, a) groups each correspond to a single pixel, and they are
  // column-major ordered.
  var flattened_source_data = source_context.getImageData(0, 0, width, height)
    .data;
  var n_pixels = width * height;
  var n_channels = flattened_source_data.length / n_pixels;

  var flattened_quantized_data = new Uint8ClampedArray(
    flattened_source_data.length
  );

  // Set each pixel to its nearest color.
  var current_pixel = new Uint8ClampedArray(n_channels);
  for (var i = 0; i < flattened_source_data.length; i += n_channels) {
    // This for loop approach is faster than using Array.slice().
    for (var j = 0; j < n_channels; ++j) {
      current_pixel[j] = flattened_source_data[i + j];
    }
    var nearest_color_index = nearest_neighbor(current_pixel, centroids);
    var nearest_color = centroids[nearest_color_index];
    for (var j = 0; j < nearest_color.length; ++j) {
      flattened_quantized_data[i + j] = nearest_color[j];
    }
  }

  var quantized_canvas = buildCanvas(width, height);
  var quantized_context = quantized_canvas.getContext('2d');

  var image = quantized_context.createImageData(width, height);
  image.data.set(flattened_quantized_data);
  quantized_context.putImageData(image, 0, 0);

  return quantized_canvas;
};

export function canvasKMeans(canvas: HTMLCanvasElement, k: number) {
  let pixel_dataset = get_pixel_dataset(canvas, MAX_K_MEANS_PIXELS);
  let centroids = k_means(pixel_dataset, k);
  return quantize(canvas, centroids);
}

export function kMeans(
  item: ActionItem,
  settings: KMeansActionSettings,
  next: (item: ActionItem) => any
) {
  if (item === 'endOfBatch') {
    next('endOfBatch');
  } else {
    let quantizedCanvas = canvasKMeans(
      findInFrames(item, 'elements.0.image'),
      settings.k
    );
    next({
      ...item,
      frames: [
        ...item.frames,
        {
          name: 'K-means',
          fromActionId: settings.actionId,
          metadata: {
            kMeansImage: quantizedCanvas
          }
        }
      ]
    });
  }
}

function getImageData(
  canvas: HTMLCanvasElement,
  viewport: Rect
): [Uint8ClampedArray, number] {
  let ctx = canvas.getContext('2d');
  let width = viewport.right - viewport.left;
  let height = viewport.bottom - viewport.top;

  let data = ctx.getImageData(viewport.left, viewport.top, width, height).data;
  var nPixels = width * height;
  var nChannels = data.length / nPixels;
  return [data, nChannels];
}

function findMostCommonColor(
  data: Uint8ClampedArray,
  nChannels: number,
  width: Pixels,
  fromX: Pixels,
  toX: Pixels,
  fromY: Pixels,
  toY: Pixels
) {
  let cellColors: any = {};
  for (let x = fromX; x < toX; x++) {
    for (let y = fromY; y < toY; y++) {
      let i = (y * width + x) * nChannels;
      let colorMap = cellColors;
      for (let c = 0; c < 3; c++) {
        let value = data[i + c];
        if (colorMap.hasOwnProperty(value)) {
          if (c < 2) {
            colorMap = colorMap[value];
          } else {
            colorMap[value] += 1;
          }
        } else {
          if (c < 2) {
            colorMap[value] = {};
            colorMap = colorMap[value];
          } else {
            colorMap[value] = 1;
          }
        }
      }
    }
  }
  let cellColorsFlat = flatten(cellColors, { delimiter: ',' });
  let color = _.maxBy(_.toPairs(cellColorsFlat), c => c[1])[0];
  return color;
}

let pendingQuantizations: Promise<any>[] = [];
let quantizationExecutor = makeSerialExecutor();
export function quantizeKMeans(
  item: ActionItem,
  settings: QuantizeKMeansActionSettings,
  next: (item: ActionItem) => any
) {
  if (item === 'endOfBatch') {
    Promise.all(pendingQuantizations).then(() => next('endOfBatch'));
    pendingQuantizations = [];
  } else {
    pendingQuantizations.push(
      quantizationExecutor(
        () =>
          new Promise(res =>
            setTimeout(() => {
              let kMeansImage = <HTMLCanvasElement>(
                findInFrames(item, 'metadata.kMeansImage')
              );
              let viewport = <Rect>findInFrames(item, 'viewport');
              let grid = <Grid>findInFrames(item, 'metadata.grid');
              let size = <SizeFormat>findInFrames(item, 'metadata.size');

              let width = viewport.right - viewport.left;
              let height = viewport.bottom - viewport.top;

              let horizontalMarginPx =
                (grid.horizontalMargin / size.width) * width;
              let verticalMarginPx =
                (grid.verticalMargin / size.height) * height;
              let widthSansMargin = width - 2 * horizontalMarginPx;
              let heightSansMargin = height - 2 * verticalMarginPx;
              let gridItemWidth = Math.floor(
                widthSansMargin / grid.columnModules
              );
              let gridItemHeight = Math.floor(
                heightSansMargin / grid.rowModules
              );

              let [data, nChannels] = getImageData(kMeansImage, viewport);

              let quantizedColors = [];
              for (let col = 0; col < grid.columnModules; col++) {
                for (let row = 0; row < grid.rowModules; row++) {
                  let fromX = Math.round(
                    horizontalMarginPx + col * gridItemWidth
                  );
                  let toX = Math.round(fromX + gridItemWidth);
                  let fromY = Math.round(
                    verticalMarginPx + row * gridItemHeight
                  );
                  let toY = Math.round(fromY + gridItemHeight);

                  let color = findMostCommonColor(
                    data,
                    nChannels,
                    width,
                    fromX,
                    toX,
                    fromY,
                    toY
                  );

                  quantizedColors.push({
                    left: col,
                    right: col + 1,
                    top: row,
                    bottom: row + 1,
                    color
                  });
                }
              }

              next({
                ...item,
                frames: [
                  ...item.frames,
                  {
                    name: 'Quantized K-means',
                    fromActionId: settings.actionId,
                    metadata: {
                      dominantColors: quantizedColors
                    }
                  }
                ]
              });
              res();
            }, 0)
          )
      )
    );
  }
}
