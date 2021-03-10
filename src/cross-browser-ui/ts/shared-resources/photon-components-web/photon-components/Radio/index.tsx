import * as React from "react";
import classNames from "classnames";

import "./index.css";

export interface RadioProps extends React.HTMLProps<HTMLInputElement> {
  disabled?: boolean;
  label?: string;
}

export const Radio = ({ disabled, label, ...props }: RadioProps) => {
  const radio = (
    <input
      className={classNames("radio", { "radio--disabled": disabled })}
      disabled={disabled}
      type="radio"
      {...props}
    />
  );

  return !label ? (
    radio
  ) : (
    <label
      className={classNames("radio__label", {
        "radio--disabled": disabled,
      })}
    >
      {radio}
      <span
        className={classNames("radio__label__text", {
          "radio--disabled__label__text": disabled,
        })}
      >
        {label}
      </span>
    </label>
  );
};

export default Radio;
