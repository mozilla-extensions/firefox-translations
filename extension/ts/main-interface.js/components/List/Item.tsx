import React from "react";
import { Props } from "./IItem";

const Item = ({ icon, text, style, action, onClick }: Props) => {

    return (
        <div className={"ListItem"} onClick={onClick}>
            { icon ? <span className={"ListItem__icon"}>{icon}</span> : null}
            { text }
            { action ? <span className={"ListItem__action"}>{action}</span> : null}
        </div>
    )

}

export default Item;