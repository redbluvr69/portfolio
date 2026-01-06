import clsx from 'clsx';
import React from 'react';

import './LevaButton.scss';

export type LevaButtonProps = {
  children: React.ReactNode;
  active?: boolean;
  intent?: 'normal' | 'primary' | 'danger' | 'warning';
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export const LevaButton = ({ children, className, intent = 'normal', active, ...rest }: LevaButtonProps) => {
  return (
    <button
      {...rest}
      className={clsx('leva-button-custom', `leva-button-custom--intent-${intent}`, {
        [`leva-button-custom--active`]: active,
      }, className)}
    >
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 0 }}>{children}</div>
    </button>
  );
};
