import React, { ChangeEvent, CSSProperties, ReactNode } from "react";
import classNames from "classnames";
import { BsXCircleFill } from "react-icons/bs";
import QualityEstimationContainer from "../QualityEstimationContainer/QualityEstimationContainer";

interface Props {
    processing?: boolean;
    style?: CSSProperties;
    textArea?: boolean;
    prefixIcon?: ReactNode;
    suffixIcon?: ReactNode;
    maxLength?: number;
    placeholder?: string;
    allowDrop?: boolean;
    allowClear?: boolean;
    onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    defaultValue?: string;
    value?: string;
}

const TextField = ({ processing,
    style,
    prefixIcon,
    suffixIcon,
    textArea,
    maxLength,
    placeholder,
    allowDrop,
    allowClear,
    value,
    defaultValue,
    onChange }: Props) => {

    const initialValue = value === undefined ? defaultValue : value;

    const [content, setContent] = React.useState(initialValue);
    const [itemOver, setItemOver] = React.useState(false);

    const classes = classNames({
        TextField: "TextField",
        processing: processing,
        withPrefixIcon: prefixIcon,
        withSuffixIcon: suffixIcon,
        textArea: textArea,
        maxLengthSet: maxLength,
        itemOver: itemOver,
        allowDrop: allowDrop,
        allowClear: allowClear
    });

    const changeHandler = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
        calculateWordPosition();
        setContent(e.target.value);
    }

    const dragOverHandler = (e: React.DragEvent<HTMLDivElement>) => {
        if (allowDrop) setItemOver(true);
    }

    const dragLeaveHandler = (e: React.DragEvent<HTMLDivElement>) => {
        if (allowDrop) setItemOver(false);
    }

    const dropHandler = (e: React.DragEvent<HTMLDivElement>) => {
        if (allowDrop) setItemOver(false);
    }

    const clear = (e: React.MouseEvent<HTMLSpanElement>) => {
        setContent("");
    }

    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    const calculateWordPosition = () => {
        console.log(inputRef.current?.value);
    }


    return (
        <div className={classes} onDragOver={dragOverHandler} onDragLeave={dragLeaveHandler} onDrop={dropHandler}>
            <QualityEstimationContainer
                text={content ? content : ""}

            />
            { prefixIcon ?
                <span className={"TextField__prefixIcon"}>{prefixIcon}</span> :
                null}
            { textArea ?
                <textarea
                    ref={inputRef}
                    placeholder={placeholder ? placeholder : "Please type in something..."}
                    maxLength={maxLength}
                    onChange={value === undefined ? changeHandler : onChange}
                    value={value === undefined ? content : value}
                /> :
                <input
                    style={style}
                    placeholder={placeholder ? placeholder : "Please type in something..."}
                    maxLength={maxLength}
                    onChange={changeHandler === undefined ? changeHandler : onChange}
                    value={value === undefined ? content : value}
                />
            }
            { suffixIcon ?
                <span className={"TextField__suffixIcon"}>{suffixIcon}</span> :
                null}
            { maxLength && content !== undefined ? <label className={"TextField__maxLength"}>{`${content.length}/`}<span style={{ color: "gray" }}>{`${maxLength}`}</span></label> : null}
            { allowClear ? content !== undefined && content.length > 0 ? <span className={"TextField__clearIcon"} onClick={clear}><BsXCircleFill /></span> : null : null}
        </div>

    )
}

export default TextField;