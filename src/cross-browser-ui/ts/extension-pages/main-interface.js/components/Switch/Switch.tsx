import React, { useState, MouseEvent, CSSProperties, ReactNode } from "react";
import classNames from "classnames";

export interface Props {
  style?: CSSProperties;
  checked?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  icon?: ReactNode;
}

const Switch = ({ checked, disabled, onToggle, icon }: Props) => {
  const classes = classNames({
    Switch: "Switch",
    checked,
    disabled,
  });

  const toggle = (e: MouseEvent) => {
    onToggle();
  };

  return (
    <button className={`${classes} focus:outline-none`} onClick={toggle}>
      <div className={`Switch__slider`}>
        {icon ? <span className={"Switch__icon"}>{icon}</span> : null}
      </div>
    </button>
  );
};

export default Switch;
