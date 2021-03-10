import * as React from "react";
import classNames from "classnames";

import "./index.css";

export interface CheckboxProps extends React.HTMLProps<HTMLInputElement> {
  disabled?: boolean;
  label?: string;
}

export const Checkbox = ({ disabled, label, ...props }: CheckboxProps) => {
  const checkbox = (
    <input
      className={classNames("checkbox", { "checkbox--disabled": disabled })}
      disabled={disabled}
      type="checkbox"
      {...props}
    />
  );
  return !label ? (
    checkbox
  ) : (
    <label
      className={classNames("checkbox__label", {
        "checkbox--disabled": disabled,
      })}
    >
      {checkbox}
      <span
        className={classNames("checkbox__label__text", {
          "checkbox--disabled__label__text": disabled,
        })}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;
