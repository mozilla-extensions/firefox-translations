import React, { cloneElement } from "react";
import classNames from "classnames";
import MenuItem from "./MenuItem";
import { BiDownload } from "react-icons/bi";
import Icon from "../Icon/Icon";

const Item = MenuItem;

const list = [
    {
        value: "English",
        key: 0
    },
    {
        value: "Czech",
        key: 1
    },
    {
        value: "German",
        key: 2
    },
    {
        value: "French",
        key: 3
    }
]

interface Props {
    setSelection?: Function;
    children?: React.ReactNode;
    getPopupContainer?: (node: HTMLElement) => Element;
}

const Menu = ({ setSelection, children }: Props) => {
    const menuRef = React.useRef<HTMLDivElement>(null)
    const [isActive, setIsActive] = React.useState(false);

    console.log(children)


    const items = list.map(i => (
        <Item key={i.key.toString()}
              onClick={() => {
                setIsActive(false)
                if (setSelection) setSelection(i.value);
            }}
              icon={<Icon icon={<BiDownload />} />}
            >{i.value}</Item>
    ))

    const classes = classNames({
        Menu: "Menu"
    });

    const clickHandler = () => setIsActive(!isActive);

    React.useEffect(() => {
        const pageClickEvent = (e: MouseEvent) => {
            if (menuRef.current !== null && !menuRef.current.contains(e.target as Node)) {
                setIsActive(!isActive);
            }
        }

        if (isActive) {
            window.addEventListener("click", pageClickEvent);
        }

        return () => {
            window.removeEventListener("click", pageClickEvent);
        }
    }, [isActive])

    const child = React.Children.only(children) as React.ReactElement<any>;

    const dropdownTrigger = cloneElement(child, {
        onClick: clickHandler
    })


    return (
        <div className={"Menu__container"}>
            { dropdownTrigger}
            { isActive ? <div className={classes} ref={menuRef}>
                {items}
            </div> : null}
        </div>
    )
}

export default Menu;