import * as React from "react";
import classNames from "classnames";

import "./index.css";

export const Link = ({
  href,
  children,
  className,
  ...props
}: React.HTMLProps<HTMLAnchorElement>) => (
  <a className={classNames("link", className)} href={href} {...props}>
    {children}
  </a>
);

export default Link;
