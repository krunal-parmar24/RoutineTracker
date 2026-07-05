import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors anywhere in the tree below it.
 * Without this, a single unexpected error (e.g. malformed data from the backend)
 * unmounts the entire app to a blank, totally unresponsive page with no visible cause.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Unhandled render error', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '36px', textAlign: 'center' }}>
            <h1 className="hero-title">Something went wrong</h1>
            <p className="section-text" style={{ marginTop: '12px' }}>{this.state.error.message}</p>
            <button type="button" className="button button-primary" style={{ marginTop: '20px' }} onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
