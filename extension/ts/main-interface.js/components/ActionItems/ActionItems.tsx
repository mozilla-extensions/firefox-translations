import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import List from "../List/List";

export interface ActionItem {
  route?: string;
  text: string | ReactNode;
  icon: ReactNode;
  action: ReactNode | false;
}

export class ActionItems extends React.Component<
  { actionItems: ActionItem[] },
  {}
> {
  render() {
    const { actionItems } = this.props;
    return (
      <List borderless>
        {actionItems.map((i: ActionItem, index) => {
          if (i.route)
            return (
              <Link
                key={`item-${index}`}
                to={`${i.route}`}
                style={i.action ? { cursor: "pointer" } : {}}
              >
                <List.Item text={i.text} icon={i.icon} action={i.action} />
              </Link>
            );
          else
            return (
              <List.Item
                style={i.action ? { cursor: "pointer" } : {}}
                key={`item-${index}`}
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
