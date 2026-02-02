import { Component, ReactNode, ErrorInfo } from 'react';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    /**
     * Callback executed when user clicks reset/try again
     * Useful for navigating back or clearing state
     */
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary - Catches runtime errors in component tree
 * Prevents white screen of death, provides graceful error UI
 * 
 * @example
 * ```tsx
 * <ErrorBoundary onReset={() => navigate('/auth')}>
 *   <SomePageThatMightCrash />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log to error reporting service (Sentry, DataDog, etc.)
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        
        // In production, send to monitoring service
        if (process.env.NODE_ENV === 'production') {
            // window.analytics?.track('Error Boundary Triggered', { error: error.message });
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className={styles.errorContainer}>
                    <div className={styles.errorCard}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h1 className={styles.title}>Something went wrong</h1>
                        <p className={styles.message}>
                            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className={styles.errorDetails}>
                                <summary>Error Stack (Dev Only)</summary>
                                <pre>{this.state.error.stack}</pre>
                            </details>
                        )}

                        <button onClick={this.handleReset} className={styles.retryButton}>
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
