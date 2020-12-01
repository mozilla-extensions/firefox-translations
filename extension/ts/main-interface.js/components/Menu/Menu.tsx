import React, { cloneElement } from "react";
import classNames from "classnames";
import MenuItem from "./MenuItem";
import { BiDownload } from "react-icons/bi";
import Icon from "../Icon/Icon";

const Item = MenuItem;

interface Props {
  items: { key: string; value: string }[];
  setSelection?: Function;
  children?: React.ReactNode;
  getPopupContainer?: (node: HTMLElement) => Element;
}

const Menu = ({ items, setSelection, children }: Props) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = React.useState(false);

  const itemElements = items.map(i => (
    <Item
      key={i.key}
      onClick={() => {
        setIsActive(false);
        if (setSelection) setSelection(i.key);
      }}
    >
      {i.value}
    </Item>
  ));

  const classes = classNames({
    Menu: "Menu",
  });

  const clickHandler = () => setIsActive(!isActive);

  React.useEffect(() => {
    const pageClickEvent = (e: MouseEvent) => {
      if (
        menuRef.current !== null &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setIsActive(!isActive);
      }
    };

    if (isActive) {
      window.addEventListener("click", pageClickEvent);
    }

    return () => {
      window.removeEventListener("click", pageClickEvent);
    };
  }, [isActive]);

  const child = React.Children.only(children) as React.ReactElement<any>;

  const dropdownTrigger = cloneElement(child, {
    onClick: clickHandler,
  });

  return (
    <div className={"Menu__container"}>
      {dropdownTrigger}
      {isActive ? (
        <div className={classes} ref={menuRef}>
          {itemElements}
        </div>
      ) : null}
    </div>
  );
};

export default Menu;
