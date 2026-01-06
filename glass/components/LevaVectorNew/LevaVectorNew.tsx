/* eslint-disable @typescript-eslint/no-explicit-any */
import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import './LevaVectorNew.scss';
import { createPlugin, useInputContext, type LevaInputProps, Components } from 'leva/plugin';
import clsx from 'clsx';
const { Row, Label, Number: NumberComp, Portal } = Components;

type VectorNewSettings = {
  xLabel?: string;
  yLabel?: string;
  xMax?: number;
  yMax?: number;
  step?: number;
  precision?: number;
  joystickSize?: number;
  confine?: 'circle';
  showVectorLine?: boolean;
};
type VectorNewValueType = { x: number; y: number };
type VectorNewProps = VectorNewValueType & VectorNewSettings;

type VectorNewLevaProps = LevaInputProps<VectorNewValueType, VectorNewSettings, string>;

type JoyStickProps = {
  showVectorLine?: boolean;
  size?: number;
  value: VectorNewValueType;
  onUpdate: (value: VectorNewValueType) => void;
};

function Joystick({
  showVectorLine = true,
  size = 130,
  onUpdate,
  value,
  settings,
}: JoyStickProps & {
  settings: Omit<Required<VectorNewSettings>, keyof JoyStickProps>;
}) {
  const [showPop, setShowPop] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [rootCenter, setRootCenter] = useState({
    x: 0,
    y: 0,
  });
  const stateRef = useRef<{
    dpr: number;
    size: number;
    showVectorLine: boolean;
    settings: typeof settings;
    value: VectorNewValueType;
    updateCanvas: () => void;
  }>({
    dpr: window.devicePixelRatio,
    updateCanvas: () => { },
    value,
    size,
    showVectorLine,
    settings,
  });
  stateRef.current.size = size;
  stateRef.current.showVectorLine = showVectorLine;
  stateRef.current.settings = settings;
  stateRef.current.value = value;

  useLayoutEffect(() => {
    if (showPop) {
      stateRef.current.dpr = window.devicePixelRatio;
      let computedStyle = null as CSSStyleDeclaration | null;
      stateRef.current.updateCanvas = () => {
        if (!canvasRef.current) {
          return;
        }
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) {
          return;
        }

        computedStyle = getComputedStyle(canvasRef.current);

        // draw
        const sizeHiDPI = stateRef.current.dpr * stateRef.current.size;
        const pad = 30;
        const sizeHiDPIPad = sizeHiDPI + pad * 2;
        const dpr = stateRef.current.dpr;
        canvasRef.current.width = sizeHiDPIPad;
        canvasRef.current.height = sizeHiDPIPad;
        canvasRef.current.style.transform = `scale(${1 / dpr}) translate(${-pad}px, ${-pad}px)`;

        const accentColor = computedStyle.getPropertyValue('--leva-colors-accent2') ?? '#007bff';
        const highlightColor =
          computedStyle.getPropertyValue('--leva-colors-highlight2') ?? '#8c92a4';

        ctx.save();
        ctx.translate(pad, pad);

        ctx.save();
        ctx.clearRect(0, 0, sizeHiDPI, sizeHiDPI);
        ctx.strokeStyle = highlightColor;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.arc(sizeHiDPI / 2, sizeHiDPI / 2, sizeHiDPI / 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(sizeHiDPI / 2, sizeHiDPI / 2, sizeHiDPI / 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.arc(sizeHiDPI / 2, sizeHiDPI / 2, (sizeHiDPI * 3) / 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // vector point
        const valuePoint = {
          x:
            (stateRef.current.value.x / (2 * stateRef.current.settings.xMax)) * sizeHiDPI +
            sizeHiDPI / 2,
          y:
            (stateRef.current.value.y / (-2 * stateRef.current.settings.yMax)) * sizeHiDPI +
            sizeHiDPI / 2,
        };


        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = accentColor;
        ctx.arc(valuePoint.x, valuePoint.y, 6 * dpr, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // vector line
        ctx.save();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(sizeHiDPI / 2, sizeHiDPI / 2);
        ctx.lineTo(valuePoint.x, valuePoint.y);
        ctx.stroke();
        ctx.restore();

        // vector center

        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = accentColor;
        ctx.arc(sizeHiDPI / 2, sizeHiDPI / 2, 3 * dpr, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();


        ctx.restore();
      };
      stateRef.current.updateCanvas();

      return () => {
        stateRef.current.updateCanvas = () => { };
      };
    }
  }, [showPop]);

  return (
    <div
      className={clsx('leva-vector-new__joystick')}
      onPointerDown={(e) => {
        if (!rootRef.current) {
          return;
        }

        const rootRect = rootRef.current.getBoundingClientRect();
        const rootCenter = {
          x: rootRect.left + rootRect.width / 2,
          y: rootRect.top + rootRect.height / 2,
        };
        setRootCenter(rootCenter);
        setShowPop(true);

        e.preventDefault();
        const onPointerMove = (e: PointerEvent) => {
          e.preventDefault();
          stateRef.current.updateCanvas();

          const pos = {
            x: e.clientX,
            y: e.clientY,
          };

          const delta = {
            x: pos.x - rootCenter.x,
            y: pos.y - rootCenter.y,
          };

          const value = {
            x: settings.xMax * (delta.x / size) * 2,
            y: settings.yMax * (delta.y / size) * -2,
          };

          onUpdate(value);
        };
        const onPointerUp = () => {
          setShowPop(false);

          document.body.removeEventListener('pointermove', onPointerMove);
          document.body.removeEventListener('pointerup', onPointerUp);
          document.body.removeEventListener('pointercancel', onPointerUp);
        };
        document.body.addEventListener('pointermove', onPointerMove);
        document.body.addEventListener('pointerup', onPointerUp);
        document.body.addEventListener('pointercancel', onPointerUp);
      }}
      ref={rootRef}
    >
      {showPop && (
        <Portal>
          <div
            className={'leva-vector-new__joystick-pop'}
            style={
              {
                '--root-center-x': `${rootCenter.x}px`,
                '--root-center-y': `${rootCenter.y}px`,
                '--joystick-size': `${size}px`,
              } as CSSProperties
            }
          >
            <div className="leva-vector-new__joystick-pop-bg"></div>
            <canvas width={1} height={1} ref={canvasRef}></canvas>
            <div className="leva-vector-new__joystick-pop-value">{`${settings.xLabel}: ${value.x}, ${settings.yLabel}: ${value.y}`}</div>
          </div>
        </Portal>
      )}
    </div>
  );
}

function LevaVectorNewComponent() {
  const props = useInputContext<VectorNewLevaProps>();
  const { label, displayValue, onUpdate, onChange, settings, value } = props;
  const settingsRequired = settings as Required<VectorNewSettings>;
  const { step, showVectorLine, joystickSize } = settingsRequired;

  return (
    <Row input className={'leva-vector-new'}>
      <Label>{label}</Label>
      <div className="leva-vector-new__input-wrapper">
        <Joystick
          showVectorLine={showVectorLine}
          size={joystickSize}
          value={value}
          onUpdate={onUpdate}
          settings={settingsRequired}
        ></Joystick>
        {(['x', 'y'] as const).map((k) => {
          return (
            <NumberComp
              key={k}
              displayValue={(displayValue as any)[k]}
              value={(displayValue as any)[k]}
              onUpdate={(v) => {
                const lastValue = value[k];
                let currentValue = lastValue;
                if (typeof v === 'function') {
                  currentValue = v(lastValue);
                } else {
                  currentValue = v;
                }

                const newValue = {
                  ...value,
                  [k]: currentValue,
                };
                onUpdate(newValue);
              }}
              onChange={(v) => {
                const newValue = {
                  ...value,
                  [k]: v,
                };

                onChange(newValue);
              }}
              settings={{
                step: step!,
                min: -Math.abs(settings[`${k}Max`]!),
                max: Math.abs(settings[`${k}Max`]!),
                pad: 0,
                initialValue: value[k],
              }}
              label={settings[`${k}Label`]!}
            ></NumberComp>
          );
        })}
      </div>
    </Row>
  );
}

const normalize = ({
  x,
  y,
  ...settings
}: VectorNewProps): { value: VectorNewValueType; settings: VectorNewSettings } => {
  return {
    value: { x, y },
    settings: {
      xMax: 1,
      yMax: 1,
      xLabel: 'x',
      yLabel: 'y',
      step: 0.01,
      precision: 2,
      showVectorLine: true,
      joystickSize: 130,
      confine: 'circle',
      ...settings,
    },
  };
};

const sanitize = (
  value: VectorNewValueType,
  settings: VectorNewSettings,
  lastValue: VectorNewValueType,
): VectorNewValueType => {
  const precision = parseInt(settings.precision! as any);

  let normalized = (['x', 'y'] as const).map((k) => {
    let v = value[k];

    if (isNaN(v)) {
      throw Error('Invalid value');
    }

    const max = settings[`${k}Max`]!;
    if (Math.abs(v) > Math.abs(max)) {
      v = (v < 0 ? -1 : 1) * max;
    }
    v = Math.round(v * Math.pow(10, precision)) / Math.pow(10, precision);
    return v;
  });

  if (settings.confine === 'circle') {
    const length = Math.sqrt(
      Math.pow(normalized[0] / settings.xMax!, 2) + Math.pow(normalized[1] / settings.yMax!, 2)
    );
    if (length > 1) {
      const scale = 1 / length;

      normalized = normalized.map((_, idx) => {
        let v = normalized[idx];
        v *= scale;
        v = Math.round(v * Math.pow(10, precision)) / Math.pow(10, precision);
        return v;
      })
    }
  }

  if (lastValue.x === normalized[0] && lastValue.y === normalized[1]) {
    throw Error('Unchanged');
  }

  return {
    x: normalized[0],
    y: normalized[1],
  };
};

const format = (v: VectorNewValueType) => {
  return {
    x: v.x,
    y: v.y,
  };
};

export const LevaVectorNew = createPlugin({
  sanitize,
  format,
  normalize,
  component: LevaVectorNewComponent,
});
