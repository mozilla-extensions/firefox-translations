import * as React from "react";
import classNames from "classnames";

interface Props {
    size?: string;
    children?: React.ReactNode;
    title?: string;
    actions?: React.ReactNode[];
    borderless?: boolean;
    style?: React.CSSProperties;
}

const Card = ({ children, actions, title, size, borderless, style }: Props) => {
    const classes = classNames({
        Card: "Card",
        borderless: borderless
    })

    return (
        <div className={classes} style={style}>
            { title ? <div className={"Card__header"}>
                <h3 className={"Card__title"}>{title}</h3>
            </div> : null
            }
            <div className={"Card__body"}>
                {children}
            </div>
            { actions ? <div className={"Card__footer"}>
                {actions}
            </div> : null
            }
        </div>
    )
}

export default Card;