import {
  SizeFormat,
  Rect,
  BackgroundImageElement,
  BackgroundColorElement
} from '../../index';

export const VIEWPORT_SIZE = 2 / 3;

export interface ViewportPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getViewportPosition(
  size: SizeFormat,
  containerEl: HTMLElement
): ViewportPosition {
  let aspectRatio = size.width / size.height;
  let containerWidth = containerEl ? containerEl.offsetWidth : 0;
  let containerHeight = containerEl ? containerEl.offsetHeight : 0;
  let viewportWidth = containerWidth * VIEWPORT_SIZE;
  let viewportHeight = viewportWidth / aspectRatio;
  if (viewportHeight > containerHeight * VIEWPORT_SIZE) {
    viewportHeight = containerHeight * VIEWPORT_SIZE;
    viewportWidth = viewportHeight * aspectRatio;
  }
  let viewportLeft = (containerWidth - viewportWidth) / 2;
  let viewportTop = (containerHeight - viewportHeight) / 2;
  return {
    width: viewportWidth,
    height: viewportHeight,
    left: viewportLeft,
    top: viewportTop
  };
}

export function getBackgroundScreenPosition(
  crop: Rect,
  size: SizeFormat,
  containerEl: HTMLElement,
  backgroundElement: BackgroundImageElement | BackgroundColorElement
) {
  let viewportPosition = getViewportPosition(size, containerEl);
  if (backgroundElement.type === 'background_image') {
    let {
      width: imageWidth,
      height: imageHeight
    } = backgroundElement.originalSize;
    let cropToViewportRatio = getCropToViewportRatio(crop, size, containerEl);
    return {
      left: viewportPosition.left - crop.left / cropToViewportRatio,
      top: viewportPosition.top - crop.top / cropToViewportRatio,
      width: imageWidth / cropToViewportRatio,
      height: imageHeight / cropToViewportRatio
    };
  } else {
    return viewportPosition;
  }
}

export function getCropToViewportRatio(
  crop: Rect,
  size: SizeFormat,
  containerEl: HTMLElement
) {
  let viewportPos = getViewportPosition(size, containerEl);
  let viewportWidth = viewportPos.width;
  let cropWidth = crop.right - crop.left;
  return cropWidth / viewportWidth;
}
