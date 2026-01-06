import clsx from 'clsx';
import { Resizable } from 're-resizable';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { type CSSProperties, type ReactNode, type Ref, useEffect, useMemo, useRef } from 'react';

import styles from './ResizableWindow.module.scss';

export type ResizeWindowCtrlRefType = {
  setMoveOffset: (offset: { x: number; y: number }) => void;
  getSize: () => { width: number; height: number };
};

type Props = {
  className?: string;
  style?: CSSProperties;
  size?: { width: number; height: number };
  onResize?: (size: { width: number; height: number }) => void;
  onMove?: (
    pos: { x: number; y: number },
    options: {
      preventDefault: () => void;
    },
  ) => void;
  ctrlRef?: Ref<ResizeWindowCtrlRefType>;
  extendBound?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  resizableRef?: Ref<Resizable | null>;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  lockAspectRatio?: boolean;
  disableMove?: boolean;
  showMoveHandle?: boolean;
  disableResize?: boolean;
  showResizeHandle?: boolean;
  children?: ReactNode;
};

export const ResizableWindow = ({
  className,
  style,
  size = { width: 100, height: 100 },
  extendBound,
  onResize,
  onMove,
  resizableRef,
  ctrlRef,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,
  lockAspectRatio,
  disableMove,
  showMoveHandle = true,
  disableResize,
  showResizeHandle = true,
  children,
}: Props) => {
  const stateRef = useRef<{
    resizableRef: Resizable | null;
    canvasSizeStart: {
      width: number;
      height: number;
    };
    canvasMoveOffset: { x: number; y: number };
    size: typeof size;
    onMove: typeof onMove;
    disableMove: typeof disableMove;
  }>({
    resizableRef: null,
    canvasSizeStart: {
      width: 0,
      height: 0,
    },
    canvasMoveOffset: {
      x: 0,
      y: 0,
    },
    size,
    onMove,
    disableMove,
  });
  stateRef.current.size = size;
  stateRef.current.onMove = onMove;
  stateRef.current.disableMove = disableMove;

  const extendBoundStyle = useMemo(() => {
    return Object.keys(extendBound ?? {}).reduce((pv, cv) => {
      (pv as any)[`--extend-bound-${cv}`] = `${(extendBound as any)[cv]}px`;
      return pv;
    }, {} as CSSProperties);
  }, [extendBound]);

  useEffect(() => {
    const rootEl = stateRef.current.resizableRef?.resizable;
    if (!rootEl) {
      return;
    }

    const onPointerDown = (e: PointerEvent) => {
      let el = e.target as HTMLElement;
      let moveable = false;
      while (el && el !== rootEl) {
        if (el.dataset.notMoveHandle) {
          moveable = false;
          break;
        }
        if (el.dataset.moveHandle) {
          moveable = true;
          break;
        }
        el = el.parentNode as HTMLElement;
      }

      if (!moveable || disableMove) {
        return;
      }

      e.stopPropagation();
      e.preventDefault();

      if (stateRef.current.disableMove) {
        return;
      }

      const startPoint = {
        x: e.clientX,
        y: e.clientY,
      };
      const startOffset = {
        ...stateRef.current.canvasMoveOffset,
      };

      const onPointerMove = (e: PointerEvent) => {
        const offsetNew = {
          x: e.clientX - startPoint.x + startOffset.x,
          y: e.clientY - startPoint.y + startOffset.y,
        };
        let defaultPrevented = false;
        stateRef.current.onMove?.(offsetNew, {
          preventDefault: () => {
            defaultPrevented = true;
          },
        });
        if (!defaultPrevented) {
          rootEl.style.transform = `translate(${offsetNew.x}px, ${offsetNew.y}px)`;
          stateRef.current.canvasMoveOffset = offsetNew;
        }
      };
      const onPointerUp = (e: PointerEvent) => {
        onPointerMove(e);
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
      };
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };
    rootEl.addEventListener('pointerdown', onPointerDown);

    return () => {
      rootEl.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <Resizable
      className={clsx(styles.resizable, className, {
        [styles.disableResize]: disableResize,
      })}
      style={{ ...style, ...extendBoundStyle }}
      size={size}
      handleClasses={{
        top: clsx(styles.handle, styles.handleTop),
        bottom: clsx(styles.handle, styles.handleBottom),
        left: clsx(styles.handle, styles.handleLeft),
        right: clsx(styles.handle, styles.handleRight),
        topLeft: clsx(styles.handle, styles.handleCorner, styles.handleTopLeft),
        topRight: clsx(styles.handle, styles.handleCorner, styles.handleTopRight),
        bottomLeft: clsx(styles.handle, styles.handleCorner, styles.handleBottomLeft),
        bottomRight: clsx(styles.handle, styles.handleCorner, styles.handleBottomRight),
      }}
      ref={(ref) => {
        stateRef.current.resizableRef = ref;
        if (typeof resizableRef === 'function') {
          resizableRef(ref);
        } else if (resizableRef) {
          resizableRef.current = ref;
        }

        const ctrl: ResizeWindowCtrlRefType = {
          getSize: () => {
            return {
              ...stateRef.current.size,
            };
          },
          setMoveOffset: (offset) => {
            const el = stateRef.current.resizableRef?.resizable;
            if (!el) {
              return;
            }

            let defaultPrevented = false;
            stateRef.current.onMove?.(offset, {
              preventDefault() {
                defaultPrevented = true;
              }
            });
            if (!defaultPrevented) {
              el.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
              stateRef.current.canvasMoveOffset = offset;
            }
          },
        };
        if (typeof ctrlRef === 'function') {
          ctrlRef(ctrl);
        } else if (ctrlRef) {
          ctrlRef.current = ctrl;
        }
      }}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      minWidth={minWidth}
      minHeight={minHeight}
      lockAspectRatio={lockAspectRatio}
      onResizeStart={() => {
        stateRef.current.canvasSizeStart = size;
      }}
      onResize={(_, _1, _2, delta) => {
        if (disableResize) {
          return;
        }

        onResize?.({
          width: stateRef.current.canvasSizeStart.width + delta.width,
          height: stateRef.current.canvasSizeStart.height + delta.height,
        });
      }}
      handleComponent={{
        bottomRight:
          !disableResize && showResizeHandle ? (
            <div className={styles.resizeHandle}>
              <UnfoldMoreIcon style={{ fontSize: 16 }}></UnfoldMoreIcon>
            </div>
          ) : undefined,
        topLeft:
          !disableMove && showMoveHandle ? (
            <div className={styles.moveHandle} data-move-handle>
              <ZoomOutMapIcon style={{ fontSize: 16 }}></ZoomOutMapIcon>
            </div>
          ) : undefined,
      }}
    >
      {children}
    </Resizable>
  );
};
