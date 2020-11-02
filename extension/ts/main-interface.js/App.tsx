import React from "react";
import Components from "./components/pages/Components";
import Demo from "./components/pages/Demo";
import Transition from "./components/pages/Transition";
import "./styles.scss";
import { Link, Switch, Route } from "react-router-dom";

const App = () => {
  const routes = (
    <Switch>
      <Route exact path="/components">
        <Components />
      </Route>
      <Route path="/demo">
        <Demo />
      </Route>
      <Route exact path="/transition">
        <Transition />
      </Route>
    </Switch>
  )


  return (
  <div className={"App"}>
      <Link to={"/components"}>Components</Link>
      <Link to={"/demo"}>Demo</Link>
      <Link to={"/transition"}>Transition</Link>
      { routes }
    </div>
  )
}

export default App;
