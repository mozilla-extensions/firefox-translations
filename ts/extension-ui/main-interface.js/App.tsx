import React from "react";
import "./styles.scss";
import { Switch, Route } from "react-router-dom";
import { observer } from "mobx-react";
import { Home } from "./routes/Home";
import { Translate } from "./routes/Translate";
import { Components } from "./routes/Components";
import { Transition } from "./routes/Transition";

@observer
export class App extends React.Component<{}, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={"BergamotApp"}>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/translate">
            <Translate />
          </Route>
          <Route exact path="/components">
            <Components />
          </Route>
          <Route exact path="/transition">
            <Transition />
          </Route>
        </Switch>
      </div>
    );
  }
}
