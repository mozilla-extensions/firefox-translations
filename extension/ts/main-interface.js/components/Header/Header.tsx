import * as React from "react";
import Icon from "../Icon/Icon";
import { useHistory } from "react-router-dom";
import { BiChevronLeft } from "react-icons/bi";

interface Props {
    text?: string
    allowBack?: boolean
    extra?: React.ReactNode;
}

const Header = ({ text, allowBack, extra }: Props) => {
    const history = useHistory();

    const clickHandler = (e?: React.MouseEvent<HTMLSpanElement | HTMLAnchorElement>) => {
        history.goBack();
    }

    return (
        <div className={"Header"}>
            { allowBack ? <a onClick={clickHandler}><Icon className={"Header__back"} icon={<BiChevronLeft />} /></a> : null}
            { text ? text : "Bergamot"}
            <span className={"Header__extra"}>{extra ? extra : null}</span>
        </div>
    )
}

export default Header;