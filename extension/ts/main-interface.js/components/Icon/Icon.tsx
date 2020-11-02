import React, { CSSProperties } from "react";
import classNames from "classnames";

interface Props {
    icon: React.ReactNode;
    style?: CSSProperties;
    className?: string;
}

const Icon = ({ icon, style, className }: Props) => {

    const classes = classNames({
        Icon: "Icon",
        [`${className}`]: className
    });

    return (
        <span className={classes} style={style}>
            { icon }
        </span>
    )
}

export default Icon;