import * as React from "react";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import {
  BsGear,
  BsLightningFill,
  BsArrowRepeat,
  BsPlus,
  BsChevronDown,
} from "react-icons/bs";
import {BiChevronRight, BiAnalyse, BiBox, BiSlider} from "react-icons/bi";
import Switch from "../Switch/Switch";
import List from "../List/List";
import TextField from "../TextField/TextField";
import logo from "../../../../src/icons/extension-icon.38x38.png";
import Header from "../Header/Header";
import {
  Route,
  Switch as ReactSwitch,
  Link,
  withRouter,
} from "react-router-dom";
import { Translator } from "../../simulator/Translator";
import { config } from "../../../config";
import Button from "../Button/Button";
import Menu from "../Menu/Menu";
import { browser } from "webextension-polyfill-ts";

const translator = new Translator("English", "Czech");
translator.setDelay(7000);

const Home = () => {
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

const Translate = () => {
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

const Landing = () => {
  return (
    <div className={"Landing"}>
      <img alt={""} src={logo} width={24}></img>
    </div>
  );
};

const Demo = () => {
  const Routes = withRouter(({ location }) => {
    return (
      <ReactSwitch location={location}>
        <Route exact path={"/"}>
          <Home />
        </Route>
        <Route exact path={`/translate`}>
          <Translate />
        </Route>
      </ReactSwitch>
    );
  });

  // let currentPage;
  // switch (page) {
  //     case "Home":
  //         currentPage = <CSSTransition timeout={300} unmountOnExit in={page === "Home"} ><Home setPage={setPage} /></CSSTransition>
  //         break;
  //     case "Translate":
  //         currentPage = <CSSTransition timeout={300} in={page === "Translate"} classNames={"item"} onEnter={() => console.log("yes")} unmountOnExit><Landing /></CSSTransition>
  //         break;
  //     default:
  //         currentPage = <CSSTransition timeout={300} in={page === "Translate"}><Home setPage={setPage} /></CSSTransition>
  // }

  return (
    <div className={"BergamotApp"}>
      {/* <TransitionGroup> */}
      {/* { currentPage } */}
      {/* { routes } */}
      <Routes />
      {/* <CSSTransition timeout={500} in={page === "Home"} classNames={"item"} unmountOnExit><Home setPage={setPage} /></CSSTransition> */}
      {/* <CSSTransition timeout={500} in={page === "Translate"} classNames={"item"} onEnter={() => console.log("yes")} unmountOnExit><Translate /></CSSTransition> */}
      {/* </TransitionGroup> */}
      {/* <Landing /> */}
    </div>
  );
};

export default Demo;
