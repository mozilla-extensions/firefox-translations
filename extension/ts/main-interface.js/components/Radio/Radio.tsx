import React from "react";
import classNames from "classnames";
import { BsDot } from "react-icons/bs";

interface Props {
    id: string,
    type?: "default" | "toggle"
}

const Radio = ({ id, type }: Props) => {
    const classes = classNames({
        Radio: "Radio",
        [`${type}`]: type
    });

    return (
        <span className={classes}>
            <input type={"radio"} id={id} name={"radio"} ></input>
            <span className={"Radio__checkmark"}><BsDot /></span>
            <label htmlFor={id}>Checkbox</label>
        </span>
    )
}

export default Radio;