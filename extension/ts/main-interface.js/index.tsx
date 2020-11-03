import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";

import "typeface-inter";
import "../shared-resources/tailwind.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { HashRouter as Router } from "react-router-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { App } from "./App";
import { DisplayError } from "./DisplayError";

const init = async () => {
  await initErrorReportingInContentScript("port-from-main-interface:index");
  ReactDOM.render(
    <ErrorBoundary displayErrorComponent={DisplayError}>
      <React.StrictMode>
        <Router>
          <App />
        </Router>
      </React.StrictMode>
    </ErrorBoundary>,
    document.getElementById("app"),
  );
};
init();
