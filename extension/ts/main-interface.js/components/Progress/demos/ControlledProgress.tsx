import React, { useState } from "react";
import Progress from "../Progress";
import Button from "../../Button/Button";
import { BsPlus, BsDash } from "react-icons/bs"
import Props from "../interface";

const ControlledProgress = ( props: Props) => {
    const [v, setV] = useState(props.value);

    const increment = (e?: React.MouseEvent<HTMLButtonElement>) => {
        if (v < 100) setV(v + 10);
    }

    const decrement = (e?: React.MouseEvent<HTMLButtonElement>) => {
        if (v > 0) setV(v - 10);
    }

    return (
        <div className={"Demo"} style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
            <Button type={"secondary"} onClick={decrement}><BsDash></BsDash></Button>
            <Progress style={{ marginLeft: 20, marginRight: 20 }} {...props} value={v} />
            <Button type={"secondary"} onClick={increment}><BsPlus></BsPlus></Button>
        </div>
    )
}

export default ControlledProgress;