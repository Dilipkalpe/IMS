import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('IMS runtime error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          className="app-error-boundary"
          role="alert"
          style={{
            padding: '2rem',
            maxWidth: 480,
            margin: '4rem auto',
            textAlign: 'center',
          }}
        >
          <h1>Something went wrong</h1>
          <p>{this.state.error.message || 'An unexpected error occurred.'}</p>
          <button type="button" onClick={this.handleReload}>
            Reload application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
