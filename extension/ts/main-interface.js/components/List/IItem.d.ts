import { CSSProperties, ReactNode } from "react";

export interface Props {
  icon?: ReactNode;
  text?: string;
  actions?: ReactNode[];
  style?: CSSProperties;
  action?: ReactNode;
  onClick?: (event: MouseEvent<HTMLDivElement, MouseEvent>) => void;
}
