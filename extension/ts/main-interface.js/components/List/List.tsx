import React, { CSSProperties, ReactNode } from "react";
import Item from "./Item";
import { Props as ItemProps } from "./IItem";
import classNames from "classnames";

interface Props {
    style?: CSSProperties;
    itemStyle?: CSSProperties;
    header?: string;
    data?: ItemProps[];
    borderless?: boolean;
    children?: ReactNode;
}

const List = ({ style, itemStyle, header, data, borderless, children }: Props) => {

    const classes = classNames({
        List: "List",
        borderless: borderless
    })

    const listItems = data ? data.map(i => {
        const props = i;
        return <Item style={itemStyle} {...props}></Item>
    }) : []

    return (
        <div className={classes} style={style}>
            { header ? <div className={"List__header"}>{header}</div> : null}
            { data ? listItems : children }
        </div>
    )

}

List.Item = Item;

export default List;