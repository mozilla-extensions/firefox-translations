import * as React from "react";
import { CSSTransition } from "react-transition-group";

const Transition = () => {
    return (
        <CSSTransition timeout={300}>
            <div></div>
        </CSSTransition>
    )
}

export default Transition;