import { Component } from "react";
import PropTypes from "prop-types";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>An unexpected error occurred. Please try again or reload the page.</p>
            {this.state.error && (
              <details open className="error-details">
                <summary>Error details</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            <div className="error-actions">
              <button onClick={this.handleRetry} className="primary-button">
                Try Again
              </button>
              <button onClick={() => window.location.reload()} className="secondary-button">
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = { children: PropTypes.node.isRequired };
