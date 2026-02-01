import { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#333', // Default to dark text, can be overridden by CSS
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: '#f8f9fa'
                }}>
                    <h2>Something went wrong.</h2>
                    {this.state.error && (
                        <details style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem', maxWidth: '80%' }}>
                            <summary>Error Details</summary>
                            {this.state.error.toString()}
                        </details>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            cursor: 'pointer',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
