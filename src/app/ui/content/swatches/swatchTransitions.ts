import * as _ from 'lodash';

interface SwatchTransition {
  element: HTMLElement;
  type: 'font' | 'color' | 'filter';
  position: { top: number; left: number; width: number; height: number };
  key: any;
}
let pendingTransitions: SwatchTransition[] = [];

export function prepareForTransition(
  el: HTMLElement,
  type: 'font' | 'color' | 'filter',
  key: any
) {
  let clone = el.cloneNode(true) as HTMLElement;
  let position = el.getBoundingClientRect();
  let left = position.left;
  let top = position.top;
  let width = position.width;
  let height = position.height;
  clone.style.position = 'fixed';
  clone.style.top = `${top}px`;
  clone.style.left = `${left}px`;
  clone.style.margin = `0px`;
  clone.style.zIndex = '1000';
  document.body.appendChild(clone);
  pendingTransitions.push({
    element: clone,
    position: { top, left, width, height },
    type,
    key
  });
}

export function doTransition(
  targetEl: HTMLElement,
  type: 'font' | 'color' | 'filter',
  key: any
): Promise<void> {
  let [pending] = _.remove(pendingTransitions, { type, key });
  if (pending) {
    let targetPosition = targetEl.getBoundingClientRect();
    let targetLeft = targetPosition.left;
    let targetTop = targetPosition.top;
    let targetWidth = targetPosition.width;
    let targetHeight = targetPosition.height;

    let el = pending.element;
    el.classList.add('is-transition-active');
    el.style.left = `${targetLeft}px`;
    el.style.top = `${targetTop}px`;
    el.style.width = `${targetWidth}px`;
    el.style.height = `${targetHeight}px`;
    el.style.opacity = '0.5';

    return new Promise(res =>
      el.addEventListener(
        'transitionend',
        () => {
          pending.element.remove();
          res();
        },
        { once: true }
      )
    );
  } else {
    return Promise.resolve();
  }
}

export function clearPendingTransitions() {
  for (let pending of pendingTransitions) {
    pending.element.remove();
  }
  pendingTransitions = [];
}
