/* eslint-disable @typescript-eslint/no-unused-vars */
// import { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './LevaCheckButtons.scss';
import { createPlugin, useInputContext, type LevaInputProps, Components } from 'leva/plugin';
// import clsx from 'clsx';
import { LevaButton } from '../LevaButton';
const { Row, Label } = Components;

type CheckButtonsSettings = {
  options: { value: string; label?: string; disabled?: boolean; }[];
  singleMode?: boolean;
  onClick?: (v: string[]) => void;
}

type CheckButtonsValueType = string[];
type CheckButtonsProps = CheckButtonsSettings & { selected: CheckButtonsValueType };

type CheckButtonsLevaProps = LevaInputProps<CheckButtonsValueType, CheckButtonsSettings, string>;

function LevaCheckButtonsComponent() {
  const props = useInputContext<CheckButtonsLevaProps>();
  const { label, displayValue, onUpdate, onChange, settings, value } = props;
  const settingsRequired = settings as Required<CheckButtonsSettings>;
  const { options, singleMode } = settingsRequired;

  return (
    <Row input className={'leva-check-buttons'}>
      <Label>{label}</Label>
      <div className="leva-check-buttons__button-group">
        {options.map((option) => {
          const selectedIdx = value.indexOf(option.value);
          const isSelected = selectedIdx >= 0;
          return (
            <LevaButton
              // active={isSelected}
              intent={isSelected ? 'primary' : 'normal'}
              disabled={option.disabled}
              key={option.value}
              onClick={() => {
                if (option.disabled) {
                  return;
                }
                if (singleMode) {
                  const newValue = [option.value];
                  onUpdate(newValue);
                  settings.onClick?.(newValue);
                  return;
                }
                if (isSelected) {
                  const newValue = value.slice();
                  newValue.splice(selectedIdx, 1);
                  onUpdate(newValue);

                  settings.onClick?.(newValue);
                } else {
                  const newValue = value.concat(option.value);
                  onUpdate(newValue);

                  settings.onClick?.(newValue);
                }
              }}
            >
              {option.label ?? option.value}
            </LevaButton>
          );
        })}
      </div>
    </Row>
  );
}

const normalize = ({
  selected,
  ...settings
}: CheckButtonsProps): {
  value: CheckButtonsValueType;
  settings: CheckButtonsSettings;
} => {
  const { options, singleMode, ...rest } = settings ?? {};

  return {
    value: selected,
    settings: {
      options: options ?? [],
      singleMode: singleMode ?? false,
      ...rest,
    },
  };
};

const sanitize = (
  value: CheckButtonsValueType,
  settings: CheckButtonsSettings,
  lastValue: CheckButtonsValueType,
  path: string,
): CheckButtonsValueType => {
  return value;
};

const format = (v: CheckButtonsValueType, settings: CheckButtonsSettings) => {
  return v;
};

export const LevaCheckButtons = createPlugin({
  sanitize,
  format,
  normalize,
  component: LevaCheckButtonsComponent,
});
