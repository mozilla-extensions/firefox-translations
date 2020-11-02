import React, { CSSProperties, ReactNode } from "react";
import classNames from "classnames";

export interface Props {
  type?: "primary" | "secondary" | "outlined";
  loading?: boolean;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
  label?: string;
  block?: boolean;
  style?: CSSProperties;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button = ({ type, prefixIcon, suffixIcon, label, disabled, block, style, onClick, children }: Props) => {

  const classes = classNames({
    Button: "Button",
    [`${type}`]: type,
    block: block
  })

  return (
    <button className={classes}
            disabled={disabled}
            style={style}
            onClick={onClick}
            >
      { prefixIcon ? <span className={`Button__prefixIcon`}>{prefixIcon}</span> : null }
      <span className={`Button__text`}>{children ? children : label ? label : "Button"}</span>
      {suffixIcon ? <span className={`Button__suffixIcon`}>{suffixIcon}</span> : null }
    </button>
  );
};

export default Button;
