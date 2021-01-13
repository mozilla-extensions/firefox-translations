import * as React from "react";
import Icon from "../Icon/Icon";
import { useHistory } from "react-router-dom";
import { BiChevronLeft } from "react-icons/bi";
import logo from "../../../../../src/icons/extension-icon.38x38.png";

interface Props {
  text?: string;
  allowBack?: boolean;
  extra?: React.ReactNode;
}

const Header = ({ text, allowBack, extra }: Props) => {
  const history = useHistory();

  const clickHandler = (
    e?: React.MouseEvent<HTMLSpanElement | HTMLAnchorElement>,
  ) => {
    history.goBack();
  };

  return (
    <div className={"Header"}>
      {allowBack ? (
        <a onClick={clickHandler}>
          <Icon className={"Header__back"} icon={<BiChevronLeft />} />
        </a>
      ) : null}
      <img
        alt={""}
        src={logo}
        width={16}
        className="mr-1"
        style={{ marginBottom: "2px" }}
      />
      {text ? text : "Bergamot Translate"}
      <span className={"Header__extra"}>{extra ? extra : null}</span>
    </div>
  );
};

export default Header;
