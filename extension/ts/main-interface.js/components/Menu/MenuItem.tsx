import React from "react";
import classNames from "classnames";

interface Props {
    children?: React.ReactNode;
    icon?: React.ReactNode;
    key: string;
    onClick?: (e:React.MouseEvent<HTMLDivElement>) => void;
    disabled?: boolean;
}

const MenuItem = ({ children, icon, onClick, disabled }: Props) => {
    const classes = classNames({
        Menu__Item: "Menu__Item",
        disabled: disabled
    })

    return (
        <div className={classes} onClick={onClick}>
            { children }
            { icon }
        </div>
    )
}

export default MenuItem;