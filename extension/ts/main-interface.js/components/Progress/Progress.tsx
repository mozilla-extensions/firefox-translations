import React, { useEffect } from "react";
import classNames from "classnames";
import { BsCheck, BsPause } from "react-icons/bs"
import Props from "./interface";

const Progress = ({ value, label, style, type, status, onFinish }: Props) => {

    useEffect(() => {
        if (value >= 100 && onFinish) {
            onFinish();
        }
    }, [value])

    const classes = classNames({
        Progress: "Progress",
        [`${type}`]: type,
        [`${status}`]: status
    });

    if (value > 100) value = 100;
    if (value < 0) value = 0;

    return (
        <div className={classes} style={style}>
            <span className={"Progress__outer"}>
                <span className={"Progress__inner"} style={{ width: value + "%" }}></span>
            </span>
            {label && !status ? <label className={"Progress__label"}>{value + "%"}</label> : null}
            {status === "finished" ? <span className={"Progress__icon"}><BsCheck /></span> : status === "paused" ? <span className={"Progress__icon"}><BsPause /></span> : null}
        </div>
    )
}

Progress.defaultProps = {
    type: "bar",
    value: 0
}

export default Progress;