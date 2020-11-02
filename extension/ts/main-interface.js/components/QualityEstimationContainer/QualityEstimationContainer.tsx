import React, { ReactNode } from "react";

interface Props {
    text: string;
    children?: ReactNode;
}

const QualityEstimationContainer = ({ text }: Props) => {


    const renderUnderline: ReactNode = (position: {}) => {
        return <div className={"underline"} />
    }

    return (
        <div className={"QualityEstimationContainer"}>
            <div className={"QualityEstimationContainer__underline"}></div>
            
        </div>
    )

}

export default QualityEstimationContainer;