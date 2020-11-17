import * as React from "react";
import {
  BsLightningFill,
  BsArrowRepeat,
  BsPlus,
  BsChevronDown,
} from "react-icons/bs";
import { BiChevronRight, BiAnalyse, BiBox, BiSlider } from "react-icons/bi";
import { Link } from "react-router-dom";
import { browser } from "webextension-polyfill-ts";
import Switch from "../components/Switch/Switch";
import Header from "../components/Header/Header";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";
import Menu from "../components/Menu/Menu";
import List from "../components/List/List";
import { config } from "../../config";
import Button from "../components/Button/Button";

export const Home = () => {
  const [language, setLanguage] = React.useState("Czech");
  const [status, setStatus] = React.useState("origin");

  const data = [
    {
      text: "Translate own text",
      icon: <BiAnalyse />,
      action: <BiChevronRight />,
      route: "translate",
    },
    {
      text: "Module Management",
      icon: <BiBox />,
      action: <BiChevronRight />,
    },
    {
      text: "Options",
      icon: <BiSlider />,
      action: <BiChevronRight />,
    },
    /*
    {
      text: (
        <>
          Always{" "}
          <Menu setSelection={setLanguage}>
            <span className={"LanguageSwitcher__select"}>
              <BsChevronDown />
            </span>
          </Menu>{" "}
          translate ${language}
        </>
      ),
      icon: <BsLightningFill />,
      action: <Switch />,
    },
    */
    {
      text: "Show quality estimation",
      icon: <BsLightningFill />,
      action: <Switch />,
    },
  ];

  const items = data.map(i => {
    if (i.route)
      return (
        <Link to={`${i.route}`}>
          <List.Item
            key={Math.random()}
            text={i.text}
            icon={i.icon}
            action={i.action}
          />
        </Link>
      );
    else
      return (
        <List.Item
          key={Math.random()}
          text={i.text}
          icon={i.icon}
          action={i.action}
        />
      );
  });

  return (
    <div className={"Home w-full"}>
      <div className="flex flex-col">
        <Header />
        {/*
        <div className={"BergamotApp__header"}>
          <TextField
            allowClear
            prefixIcon={<img alt={""} src={logo} width={16} />}
            placeholder={"Quick translate"}
            style={{ width: "100%", borderRadius: "4px 4px 0 0" }}
          />
        </div>
        */}
        <div className={"BergamotApp__languageSwitcher"}>
          <LanguageSwitcher onSwitch={setLanguage} />
        </div>
        <List style={{ cursor: "pointer" }} borderless>
          {items}
        </List>
        <div className={"BergamotApp__footer mt-4"}>
          <span>
            <a
              className=""
              target="_blank"
              href={browser.runtime.getURL(`get-started/get-started.html`)}
            >
              About
            </a>
          </span>
          <span>
            <a
              className="inline ml-1.5 underline hover:text-grey-60"
              target="_blank"
              href={config.feedbackSurveyUrl}
            >
              Feedback
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};
