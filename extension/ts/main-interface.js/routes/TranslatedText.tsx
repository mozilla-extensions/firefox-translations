import TextField from "../components/TextField/TextField";
import * as React from "react";
import { Translator } from "../lib/Translator";
const translator = new Translator();
interface TranslatedTextProps {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}
export const TranslatedText = ({
  text,
  sourceLanguage,
  targetLanguage,
}: TranslatedTextProps) => {
  const [translatedText, setTranslatedText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!text || text === "") {
      return;
    }
    setLoading(true);
    translator.translate(sourceLanguage, targetLanguage, text).then(res => {
      setTranslatedText(res);
      setLoading(false);
    });
  }, [sourceLanguage, targetLanguage, text]);
  return (
    <TextField
      textArea
      value={translatedText}
      disabled={true}
      processing={loading}
    />
  );
};
