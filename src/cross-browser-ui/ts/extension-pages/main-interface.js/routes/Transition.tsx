import * as React from "react";
import { CSSTransition } from "react-transition-group";

export const Transition = () => {
  return (
    <CSSTransition timeout={300}>
      <div></div>
    </CSSTransition>
  );
};
