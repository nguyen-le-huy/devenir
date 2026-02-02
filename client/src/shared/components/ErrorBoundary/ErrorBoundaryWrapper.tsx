import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

/**
 * ErrorBoundaryWrapper - Wraps critical auth pages with error boundary
 * Provides graceful error handling and navigation back to auth page
 */
const ErrorBoundaryWrapper = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();

    const handleReset = useCallback(() => {
        navigate('/auth');
    }, [navigate]);

    return (
        <ErrorBoundary onReset={handleReset}>
            {children}
        </ErrorBoundary>
    );
};

export default ErrorBoundaryWrapper;
