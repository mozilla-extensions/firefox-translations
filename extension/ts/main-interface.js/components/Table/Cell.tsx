import React from "react";

interface Props {
    content?: string | number
    header?: boolean
}

const Cell = ({ content, header }: Props) => {
    return (
        header ?
            (
                <th className={"Cell Cell-header"}>
                    { content }
                </th>) :
            (
                <td className={"Cell"}>
                    { content}
                </td>
            )

    )
}

export default Cell;