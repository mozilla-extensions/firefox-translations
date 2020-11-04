import * as React from "react";
import { Component, MouseEvent } from "react";
import "../shared-resources/tailwind.css";
import { config } from "../config";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { ExtensionPreferences } from "../background.js/Store";
import { captureExceptionWithExtras } from "../shared-resources/ErrorReporting";
import { DisplayError } from "../options-ui.js/DisplayError";

export interface GetStartedProps {}

export interface GetStartedState {
  loading: boolean;
  error: boolean;
  extensionPreferences: ExtensionPreferences | null;
}

export class GetStarted extends Component<GetStartedProps, GetStartedState> {
  public state = {
    loading: true,
    error: false,
    extensionPreferences: null,
  };

  private backgroundContextPort: Port;

  async componentDidMount(): Promise<void> {
    // console.log("Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-get-started:component",
    });

    this.backgroundContextPort.postMessage({
      requestExtensionPreferences: true,
    });

    this.backgroundContextPort.onMessage.addListener(
      async (m: { extensionPreferences?: ExtensionPreferences }) => {
        if (m.extensionPreferences) {
          const { extensionPreferences } = m;
          console.log("Get started UI received extension preferences", {
            extensionPreferences,
          });
          await this.setState({
            loading: false,
            extensionPreferences,
          });
          return null;
        }
        captureExceptionWithExtras(new Error("Unexpected message"), { m });
        console.error("Unexpected message", { m });
        await this.setState({
          loading: false,
          error: true,
        });
      },
    );
  }

  hideBanner = async (event: MouseEvent) => {
    event.preventDefault();
    await this.saveExtensionPreferences({
      ...this.state.extensionPreferences,
      hidePrivacySummaryBanner: true,
    });
  };

  saveExtensionPreferences = async (
    updatedExtensionPreferences: ExtensionPreferences,
  ) => {
    this.backgroundContextPort.postMessage({
      saveExtensionPreferences: { updatedExtensionPreferences },
    });
  };

  handleEnableErrorReportingChange = async (event: MouseEvent) => {
    event.preventDefault();
    await this.saveExtensionPreferences({
      ...this.state.extensionPreferences,
      enableErrorReporting: !this.state.extensionPreferences
        .enableErrorReporting,
    });
  };

  removeExtension = (event: MouseEvent) => {
    event.preventDefault();
    this.backgroundContextPort.postMessage({
      removeExtension: true,
    });
  };

  render() {
    if (this.state.error) {
      return <DisplayError />;
    }
    return (
      <>
        {!this.state.loading &&
          this.state.extensionPreferences &&
          !this.state.extensionPreferences.hidePrivacySummaryBanner && (
            <div className="w-full bg-gray-900 text-white py-4">
              <div className="mx-auto max-w-2xl font-sans">
                <div
                  role="alert"
                  className="m-auto p-3 items-center text-gray-100 leading-tight flex"
                >
                  <div className="font-normal text-m text-left flex-auto">
                    <div className="font-bold mb-2">
                      Bergamot Translate and your data
                    </div>
                    <div className="mb-2">
                      The text that you choose to translate will not be sent to
                      a server - the translation is performed locally in your
                      browser.
                    </div>
                    <div className="mb-2">
                      By default, this add-on does not submit any information to
                      Mozilla, with the following exception:
                      <ul className="list-disc">
                        <li className="ml-4 my-4">
                          When you choose to translate a document into a
                          language that you have not translated into before, the
                          add-on will automatically download the required
                          language files necessary to perform the translation.
                        </li>
                      </ul>
                    </div>
                    <div className="mb-2">
                      You can choose to share additional info with us which
                      helps us improve this add-on. To{" "}
                      {this.state.extensionPreferences.enableErrorReporting
                        ? "prevent the add-on from automatically sending"
                        : "automatically send"}{" "}
                      error reports to Mozilla,{" "}
                      <div
                        onClick={this.handleEnableErrorReportingChange}
                        className="inline underline font-bold cursor-pointer"
                      >
                        {" "}
                        {this.state.extensionPreferences.enableErrorReporting
                          ? "disable"
                          : "enable"}{" "}
                        error reports here
                      </div>
                      .
                    </div>
                    <div>
                      For further information, see the full{" "}
                      <a
                        href={config.privacyNoticeUrl}
                        target="_blank"
                        className="underline"
                      >
                        privacy notice
                      </a>{" "}
                      for this add-on.
                    </div>
                  </div>
                  <div
                    onClick={this.hideBanner}
                    className="ml-5 cursor-pointer img-icon-close-white"
                  ></div>
                </div>
              </div>
            </div>
          )}
        <div className="absolute" />
        <div className="absolute" />
        <div className="px-16">
          <div className="mx-auto max-w-2xl grid grid-cols-12 gap-5 font-sans text-xl">
            <div className="col-span-1" />
            <div className="col-span-10">
              <div className="flex flex-col text-center">
                <div className="img-mozilla-logo m-auto mt-16 leading-none" />
                <div className="font-sans font-light text-3xl mt-4 leading-none">
                  Bergamot Translate
                </div>
                <div className="font-sans text-5xl mt-16 leading-none">
                  Welcome!
                </div>
              </div>
            </div>
            <div className="col-span-1" />
          </div>
        </div>
      </>
    );
  }
}
