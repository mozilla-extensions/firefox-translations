import * as React from "react";
import { BsGear } from "react-icons/bs";
import Header from "../components/Header/Header";
import { Translator } from "../simulator/Translator";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import TextField from "../components/TextField/TextField";

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

  return (
    <div className={"Translate w-full"}>
      <Header allowBack extra={<BsGear />} />
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
    </div>
  );
};
