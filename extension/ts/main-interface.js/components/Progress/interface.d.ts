import { isPropertySignature } from "typescript";

interface Props {
    value: number;
    label?: boolean;
    style?: CSSProperties;
    type?: "bar" | "ring";
    status?: "processing" | "finished" | "paused";
    onFinish?: () => void;
}

export default Props;