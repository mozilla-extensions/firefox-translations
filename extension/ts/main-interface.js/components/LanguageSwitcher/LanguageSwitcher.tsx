import * as React from "react";
import classNames from "classnames";
import { BsChevronDown } from "react-icons/bs";
import Menu from "../Menu/Menu";
import Icon from "../Icon/Icon";
import { BiTransfer } from "react-icons/bi";

interface Props {
    onSwitch: (language: string) => void;
}

const languageList = [
    "Czech",
    "French",
    "Spanish"
]

const sourceLanguage = "English";

const LanguageSwitcher = ({ onSwitch }: Props) => {
    const [language, setLanguage] = React.useState("source");
    const [targetLanguage, setTargetLanaguage] = React.useState("Czech");
    const [listOpen, setListOpen] = React.useState(false);

    const classes = classNames({
        LanguageSwitcher: "LanguageSwitcher",
        [`${language}`]: language
    });

    React.useEffect(() => {
        onSwitch(targetLanguage);
    }, [targetLanguage])


    const languages = languageList.map(i => <option value={i} key={Math.random()}>{i}</option>);

    const switchLanguage = (e?: React.MouseEvent<HTMLSpanElement>) => {
        return (language: string) => setLanguage(language);
    }

    const changeTargetLanguage = (language: string) => {
        setTargetLanaguage(language);
    }

    const changeSwitchLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTargetLanaguage(e.target.value);
    }

    const blurHandler = (e: React.FocusEvent<HTMLSpanElement>) => {
        setListOpen(false)
    }

    return (
        <div className={classes}>
            <span className={"LanguageSwitcher__sourceLanguage"} onClick={e => switchLanguage(e)("source")}>
            <span className={"LanguageSwitcher__languageType"}>Source</span>
                {sourceLanguage}
            </span>
            <span className={"LanguageSwitcher__delimiter"}><Icon style={{ width: 24, height: 24, color: "#30d5c8" }} icon={<BiTransfer />} /></span>
            <span className={"LanguageSwitcher__targetLanguage"} onClick={e => switchLanguage(e)("target")}>
                <span className={"LanguageSwitcher__languageType"}>Target</span>
                <span className={"target"}>{targetLanguage}
                    <Menu setSelection={changeTargetLanguage}>
                        <span className={"LanguageSwitcher__select"}>
                            <BsChevronDown />
                        </span>
                    </Menu>
                </span>
            </span>
        </div>
    )
}

export default LanguageSwitcher;