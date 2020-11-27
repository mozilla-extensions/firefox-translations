import * as React from "react";
import { BsBoxArrowUpRight, BsLightningFill } from "react-icons/bs";
import Header from "../components/Header/Header";
import { Translator } from "../simulator/Translator";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import TextField from "../components/TextField/TextField";
import { ActionItem, ActionItems } from "../components/ActionItems/ActionItems";
import Switch from "../components/Switch/Switch";

const translator = new Translator("English", "Czech");
translator.setDelay(7000);

export const Translate = () => {
  const [text, setText] = React.useState("");
  const [language, setLanguage] = React.useState("Czech");
  const [translatedText, setTranslatedText] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    translator.translate(text).then(res => {
      setTranslatedText(res);
      setLoading(false);
    });
  }, [text]);

  const changeHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setText(e.target.value);
  };

  const actionItems: ActionItem[] = [
    {
      text: "Show quality estimation",
      icon: <BsLightningFill />,
      action: <Switch />,
    },
  ];

  return (
    <div className={"Translate w-full"}>
      <Header allowBack extra={<BsBoxArrowUpRight />} />
      <div className={"BergamotApp__languageSwitcher"}>
        <LanguageSwitcher onSwitch={setLanguage} />
      </div>
      <div className={"Translate__body"}>
        <div className={"Translate__originText"}>
          <div className={"Translate__title"}>Origin</div>
          <TextField textArea value={text} onChange={changeHandler} />
        </div>
        <div className={"Translate__targetText"}>
          <div className={"Translate__title"}>Target</div>
          <TextField textArea value={translatedText} processing={loading} />
        </div>
      </div>
      <ActionItems actionItems={actionItems} />
    </div>
  );
};
