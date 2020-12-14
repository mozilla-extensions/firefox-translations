import TextField from "../components/TextField/TextField";
import * as React from "react";
import { Translator } from "../lib/Translator";
const translator = new Translator();
interface TranslatedTextProps {
  text: string;
  translateFrom: string;
  translateTo: string;
}
export const TranslatedText = ({
  text,
  translateFrom,
  translateTo,
}: TranslatedTextProps) => {
  const [translatedText, setTranslatedText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!text || text === "") {
      return;
    }
    setLoading(true);
    translator.translate(translateFrom, translateTo, text).then(res => {
      setTranslatedText(res);
      setLoading(false);
    });
  }, [translateFrom, translateTo, text]);
  return (
    <TextField
      textArea
      value={translatedText}
      disabled={true}
      processing={loading}
    />
  );
};
