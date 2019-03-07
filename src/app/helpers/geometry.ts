import { Rect } from '../index';

export function intersectRect(rect1: Rect, rect2: Rect) {
  let xOverlap = Math.max(
    0,
    Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)
  );
  let yOverlap = Math.max(
    0,
    Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
  );
  return xOverlap * yOverlap;
}

export function getRectArea({ left, right, top, bottom }: Rect) {
  return (right - left) * (bottom - top);
}

export function anyRectsOverlap(rects: Rect[]) {
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (intersectRect(rects[i], rects[j]) > 0) {
        return true;
      }
    }
  }
  return false;
}
