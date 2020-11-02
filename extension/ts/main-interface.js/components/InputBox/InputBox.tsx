import * as React from "react";

interface Props {
    
}

const InputBox = ({}:Props) => {
    const [value, setValue] = React.useState("This is a good idea.")

    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        value.indexOf("This");
        
    }, [])

    return <div className={"InputBox"}
                contentEditable
                ref={ref}
                >
        { value }
    </div>
};

export default InputBox;