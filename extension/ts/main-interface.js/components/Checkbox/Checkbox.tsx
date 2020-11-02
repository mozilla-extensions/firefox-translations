import React from "react";
import { BsCheck } from "react-icons/bs";

interface Props {
    id: string,
    label?: string
}

const Checkbox = ({ id, label }: Props) => {
    const [checked, setChecked] = React.useState(false);

    const toggle = (e?: React.MouseEvent) => {
        setChecked(!checked)
    }

    return (
        <span className={"Checkbox"}>
            <input type={"checkbox"} id={id} name={"language"} checked={checked}></input>
            <span onClick={toggle} className={"Checkbox__checkmark"}><BsCheck /></span>
            {label ? <label onClick={toggle} htmlFor={id}>{label}</label> : null}
        </span>
    )
}

export default Checkbox;