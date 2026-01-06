type ObserveCb = (rect: DOMRect, target: HTMLElement) => void;

// Global observer
let resizeObserver: ResizeObserver | null = null;
const observed = new WeakMap<Element, ObserveCb[]>();

const onResize: ResizeObserverCallback = (entries) => {
  entries.forEach((entry) => {
    const info = observed.get(entry.target);

    if (info) {
      const cbList = info;
      cbList.forEach((cb) => {
        cb(entry.contentRect as DOMRect, entry.target as HTMLElement);
      });
    }
  });
};

const unobserve = (el: HTMLElement, cb?: ObserveCb) => {
  if (!observed.has(el) || !resizeObserver) {
    return;
  }

  if (!cb) {
    observed.delete(el);
    resizeObserver.unobserve(el);
    return;
  }

  const cbList = observed.get(el)!;
  const cbIdx = cbList.indexOf(cb);
  if (cbIdx > -1) {
    cbList.splice(cbIdx, 1);
  }
  if (!cbList.length) {
    observed.delete(el);
    resizeObserver.unobserve(el);
  }
};

const observe = (el: HTMLElement, cb: ObserveCb) => {
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(onResize);
  }

  if (!observed.has(el)) {
    observed.set(el, []);
    resizeObserver.observe(el);
  }

  const cbList = observed.get(el)!;
  if (!cbList.includes(cb)) {
    cbList.push(cb);
  }

  return () => {
    unobserve(el, cb);
  };
};

export function useResizeObserver() {
  return {
    observe,
    unobserve,
  };
}
