import * as React from "react";
import { MouseEvent } from "react";
import { GeneralErrorMessage } from "../../shared-resources//GeneralErrorMessage";

export class DisplayError extends React.Component<
  {
    message?: string;
    additionalInfo?: string;
    eventId?: string;
  },
  {}
> {
  constructor(props) {
    super(props);
  }

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  render() {
    return (
      <>
        <GeneralErrorMessage
          message={this.props.message}
          additionalInfo={this.props.additionalInfo}
          eventId={this.props.eventId}
        />
      </>
    );
  }
}
