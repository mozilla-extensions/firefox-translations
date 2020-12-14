import * as React from "react";
import { Sentry } from "./ErrorReporting";

interface ErrorBoundaryProps {
  displayErrorComponent: React.ComponentType<{
    message?: string;
    eventId?: string;
  }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  eventId: null | string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
    Sentry.withScope(scope => {
      scope.setExtras(errorInfo);
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  render() {
    if (this.state.hasError) {
      // Render a fallback UI in case of error
      const DisplayError = this.props.displayErrorComponent;
      return <DisplayError eventId={this.state.eventId} />;
    }
    return this.props.children;
  }
}
