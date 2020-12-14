import * as React from "react";
import { HTMLProps } from "react";

import "./index.css";

export interface ButtonProps extends HTMLProps<HTMLButtonElement> {
  type?: string;
  photonSize?: string;
}

export const Button = ({
  type,
  photonSize,
  children,
  ...props
}: ButtonProps) => {
  let optionClasses = "button ";
  if (type) optionClasses = optionClasses += `button--${type} `;
  if (photonSize) optionClasses = optionClasses += `button--${photonSize} `;

  return (
    <button className={optionClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
