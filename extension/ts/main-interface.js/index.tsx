import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";

import "typeface-inter";
import "../shared-resources/tailwind.css";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { HashRouter as Router } from "react-router-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { App } from "./App";
import { DisplayError } from "./DisplayError";
import { subscribeToExtensionState } from "../shared-resources/subscribeToExtensionState";
import { ExtensionState } from "../shared-resources/models/ExtensionState";
import { Provider } from "mobx-react";
import { DocumentTranslationState } from "../shared-resources/models/DocumentTranslationState";
import { getCurrentTab } from "../../../../../mofo/regrets-reporter/ts/background.js/lib/getCurrentTab";
import { TranslateOwnTextTranslationState } from "../shared-resources/models/TranslateOwnTextTranslationState";

// Workaround for https://github.com/xaviergonz/mobx-keystone/issues/183
// We need to import some models explicitly lest they fail to be registered by mobx-keystone
new ExtensionState({});
new DocumentTranslationState({});
new TranslateOwnTextTranslationState({});

const init = async () => {
  await initErrorReportingInContentScript("port-from-main-interface:index");
  // Prepare some objects that can be injected anywhere in the React component tree
  const extensionState = await subscribeToExtensionState();
  const currentTab = await getCurrentTab();

  // Allows the main interface for a specific tab to be rendered in a separate tab
  let tabId = currentTab.id;
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.search
  ) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("tabId")) {
      tabId = parseInt(urlParams.get("tabId"), 10);
      console.log("Using tabId from URL");
    }
  }

  ReactDOM.render(
    <ErrorBoundary displayErrorComponent={DisplayError}>
      <React.StrictMode>
        <Router>
          <Provider extensionState={extensionState} tabId={tabId}>
            <App />
          </Provider>
        </Router>
      </React.StrictMode>
    </ErrorBoundary>,
    document.getElementById("app"),
  );
};
init();
