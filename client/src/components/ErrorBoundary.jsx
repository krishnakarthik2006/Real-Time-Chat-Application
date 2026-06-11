import { Component } from "react";
import PropTypes from "prop-types";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
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
            <p>We're sorry, but something unexpected happened. Please try again.</p>
            
            {import.meta.env.DEV && (
              <details className="error-details">
                <summary>Error Details</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack || "No component stack available."}</pre>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="primary-button"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="secondary-button"
              >
                Reload Page
              </button>
            </div>
          </div>
          
          <style>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 2rem;
              background: #f8f9fa;
            }
            
            .error-content {
              max-width: 500px;
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .error-content h2 {
              color: #dc3545;
              margin-bottom: 1rem;
            }
            
            .error-content p {
              color: #6c757d;
              margin-bottom: 1.5rem;
            }
            
            .error-details {
              text-align: left;
              margin: 1rem 0;
              padding: 1rem;
              background: #f8f9fa;
              border-radius: 4px;
              border: 1px solid #dee2e6;
            }
            
            .error-details summary {
              cursor: pointer;
              font-weight: bold;
              margin-bottom: 0.5rem;
            }
            
            .error-details pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              font-size: 0.875rem;
              color: #e83e8c;
              max-height: 200px;
              overflow-y: auto;
            }
            
            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              flex-wrap: wrap;
            }
            
            .primary-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
            }
            
            .primary-button:hover {
              background: #0056b3;
            }
            
            .secondary-button {
              background: #6c757d;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
            }
            
            .secondary-button:hover {
              background: #545b62;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
