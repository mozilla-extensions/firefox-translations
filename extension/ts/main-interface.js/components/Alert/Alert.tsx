import React, { CSSProperties, ReactNode, useState } from "react";
import classNames from "classnames";
import { BsX } from "react-icons/bs";


export interface Props {
    status?: "info" | "error" | "warning" | "success";
    prefixIcon?: ReactNode;
    info?: string;
    style?: CSSProperties;
    closeButton?: ReactNode;
    closable?: boolean;
}



const Alert = ({ status, prefixIcon, info, style, closable, closeButton }: Props) => {
    const [visible, setVisible] = useState(true);

    const close = (e?:React.MouseEvent<HTMLSpanElement>) => {
        setVisible(false);
    }

    const classes = classNames({
        Alert: "Alert",
        [`${status}`]: status,
    })

    return (
        visible ?
        <div className={classes}>
            <span className={"Alert__prefixIcon"}>{prefixIcon}</span>
            <span className={"Alert__text"}>{info}</span>
            <span className={"Alert__closeButton"} onClick={close}>{closable ? closeButton ? closeButton : <BsX /> : null }</span>
        </div> : null
    );
};

export default Alert;
