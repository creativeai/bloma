declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.ttf' {
  const content: any;
  export default content;
}

declare module '*.otf' {
  const content: any;
  export default content;
}

declare module '*.woff' {
  const content: any;
  export default content;
}

declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
    window: Window;
  }

  export default WebpackWorker;
}

declare let OffscreenCanvas: {
  new (width: number, height: number): OffscreenCanvas;
  prototype: OffscreenCanvas;
};

interface OffscreenCanvas extends HTMLCanvasElement {}

// NPM packages without types we're using
declare module 'parse-color';
declare module 'simplify-geometry';
declare module 'smartcrop';
declare module '@tensorflow/tfjs';
declare module 'tfjs-yolo-tiny';
declare module 'bi-directional-map/dist';
declare module 'react-color';
declare module 'react-confirm-alert';
declare module 'unsplash-js';
declare module 'smartquotes';
