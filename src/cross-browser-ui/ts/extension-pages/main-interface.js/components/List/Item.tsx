import React from "react";
import { Props } from "./IItem";

const Item = ({ icon, text, style, action, onClick }: Props) => {
  return (
    <div className={"ListItem"} onClick={onClick}>
      {icon ? <span className={"ListItem__icon"}>{icon}</span> : null}
      <span className="mr-2">{text}</span>
      {action ? (
        <span className={"ListItem__action ml-auto"}>{action}</span>
      ) : null}
    </div>
  );
};

export default Item;
