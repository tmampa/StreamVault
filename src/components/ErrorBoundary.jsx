import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="loading-container" style={{ marginTop: 'var(--nav-height)', minHeight: '50vh' }}>
          <div className="error-message">
            <span className="error-message__icon">
              <AlertTriangle size={20} />
            </span>
            <span>Something went wrong. Try again or reload the page.</span>
          </div>
          <button type="button" className="btn btn--primary" style={{ marginTop: 16 }} onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
