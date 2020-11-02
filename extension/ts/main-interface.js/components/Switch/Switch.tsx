import React, { useState, MouseEvent, CSSProperties, ReactNode } from "react";
import classNames from "classnames";

export interface Props {
    style?: CSSProperties;
    disabled?: boolean;
    onToggle?: () => void;
    icon?: ReactNode;
}

const Switch = ({disabled, onToggle, icon}: Props) => {
    const [checked, setChecked] = useState(false);


    const classes = classNames({
        Switch: "Switch",
        checked: checked,
        disabled: disabled
    });

    const toggle = (e: MouseEvent) => {
        setChecked(!checked)
        if (onToggle) {
            onToggle();
        }
    }

    return (
        <button className={classes} onClick={toggle}>
            <div className={`Switch__slider`}>
                {icon ? <span className={"Switch__icon"}>{icon}</span> : null}
            </div>
        </button>
    )
}

export default Switch;