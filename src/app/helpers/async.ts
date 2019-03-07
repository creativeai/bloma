interface QueueItem {
  fn: () => any;
  onDone: () => any;
}

export function makeSerialExecutor() {
  let queue: QueueItem[] = [],
    processing = false;

  function processNext() {
    if (queue.length === 0 || processing) return;

    let { fn, onDone } = queue.shift();
    processing = true;
    fn().finally(() => {
      processing = false;
      onDone();
      setTimeout(processNext, 0);
    });
  }

  return (fn: () => any) => {
    return new Promise(onDone => {
      queue.push({ fn, onDone });
      processNext();
    });
  };
}

export function defer(fn: () => any) {
  return new Promise(res => {
    setTimeout(() => res(fn()), 16);
  });
}
