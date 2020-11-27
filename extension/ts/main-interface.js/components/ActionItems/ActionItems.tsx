import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import List from "../List/List";

export interface ActionItem {
  route?: string;
  text: string | ReactNode;
  icon: ReactNode;
  action: ReactNode;
}

export class ActionItems extends React.Component<
  { actionItems: ActionItem[] },
  {}
> {
  render() {
    const { actionItems } = this.props;
    return (
      <List style={{ cursor: "pointer" }} borderless>
        {actionItems.map(i => {
          if (i.route)
            return (
              <Link key={`item-${i}`} to={`${i.route}`}>
                <List.Item text={i.text} icon={i.icon} action={i.action} />
              </Link>
            );
          else
            return (
              <List.Item
                key={`item-${i}`}
                text={i.text}
                icon={i.icon}
                action={i.action}
              />
            );
        })}
      </List>
    );
  }
}
