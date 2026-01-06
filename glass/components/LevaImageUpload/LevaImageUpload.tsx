import { type CSSProperties, useEffect, useMemo, useRef } from 'react';
import './LevaImageUpload.scss';
import { createPlugin, useInputContext, type LevaInputProps, Components } from 'leva/plugin';
import DeleteIcon from '@mui/icons-material/Delete';
import clsx from 'clsx';
const { Row, Label, String } = Components;

type ImageUploadSettings = {
  accept?: string;
  previewSize?: number | [number, number];
  displayDisabled?: boolean;
  clearable?: boolean;
  alphaPatternSize?: number;
  alphaPatternColorA?: string;
  alphaPatternColorB?: string;
};
type ImageUploadValueType = { file?: string };
type ImageUploadProps = ImageUploadValueType & ImageUploadSettings;

type ImageUploadLevaProps = LevaInputProps<ImageUploadValueType, ImageUploadSettings, string>;

function GreenOrBlue() {
  const props = useInputContext<ImageUploadLevaProps>();
  const { label, displayValue, onUpdate, onChange, settings, value, disabled } = props;

  const stateRef = useRef<{
    imageObjURL: null | string;
  }>({
    imageObjURL: null,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const {
    previewSize,
    accept,
    alphaPatternSize,
    alphaPatternColorA,
    alphaPatternColorB,
    displayDisabled,
    clearable,
  } = settings;

  const previewSizeNorm =
    typeof previewSize === 'number'
      ? ([previewSize, previewSize] as const)
      : (previewSize as [number, number]);

  return (
    <Row
      input
      className={clsx('leva-image-upload', {
        'leva-image-upload--disabled': displayDisabled,
      })}
    >
      <Label>{label}</Label>
      <div
        style={
          {
            '--preview-width': `${previewSizeNorm[0]}px`,
            '--preview-height': `${previewSizeNorm[1]}px`,
            '--alpha-pattern-size': `${alphaPatternSize}px`,
            '--alpha-pattern-color-a': `${alphaPatternColorA}`,
            '--alpha-pattern-color-b': `${alphaPatternColorB}`,
          } as CSSProperties
        }
      >
        <input
          style={{ display: 'none' }}
          disabled={disabled}
          type="file"
          data-label={displayValue}
          accept={accept}
          multiple={false}
          ref={inputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              return;
            }
            if (stateRef.current.imageObjURL) {
              URL.revokeObjectURL(stateRef.current.imageObjURL);
            }
            stateRef.current.imageObjURL = URL.createObjectURL(file);
            e.target.value = '';
            onUpdate(stateRef.current.imageObjURL);
            onChange(stateRef.current.imageObjURL);
          }}
        ></input>
        <div
          className="leva-image-upload__preview"
          onClick={() => {
            if (!inputRef.current) {
              return;
            }
            inputRef.current.click();
          }}
        >
          {value?.file ? (
            <img src={value?.file} className="leva-image-upload__preview-img"></img>
          ) : null}
          {value?.file && clearable && <DeleteIcon className="leva-image-upload__clearbt" onClick={(e) => {
            e.stopPropagation();
            onUpdate({ file: undefined });
            onChange({ file: undefined });
          }}></DeleteIcon>}
        </div>
      </div>
    </Row>
  );
}

const normalize = ({
  file = undefined,
  ...settings
}: ImageUploadProps): { value: { file?: string }; settings: ImageUploadSettings } => {
  return {
    value: { file },
    settings: {
      displayDisabled: false,
      accept: 'image/*',
      clearable: true,
      previewSize: 60,
      alphaPatternSize: 20,
      alphaPatternColorA: '#5b5f6b',
      alphaPatternColorB: 'var(--leva-colors-elevation1)',
      ...settings,
    },
  };
};

const sanitize = (v?: any): ImageUploadValueType => {
  //   if (!['green', 'blue', 'lightgreen', 'lightblue'].includes(v)) throw Error('Invalid value')
  //   // @ts-ignore
  //   const [, isLight, color] = v.match(/(light)?(.*)/)
  if (typeof v === 'string') {
    return { file: v }
  }

  if ('file' in v) {
    return v;
  }

  return {
    file: undefined
  }
};

const format = (v: ImageUploadValueType) => {
  if (!v.file) {
    return undefined;
  }

  return { file: v.file };
};

export const LevaImageUpload = createPlugin({
  sanitize,
  format,
  normalize,
  component: GreenOrBlue,
});
