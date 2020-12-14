import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { OptionsUi } from "./OptionsUi";
import { DisplayError } from "./DisplayError";

const init = async () => {
  await initErrorReportingInContentScript("port-from-options-ui:index");
  ReactDOM.render(
    <div className="text-lg leading-snug px-5 py-4 mx-0">
      <ErrorBoundary displayErrorComponent={DisplayError}>
        <OptionsUi />
      </ErrorBoundary>
    </div>,
    document.getElementById("app"),
  );
};
init();
