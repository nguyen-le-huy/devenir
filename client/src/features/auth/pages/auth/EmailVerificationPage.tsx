import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVerifyEmail } from '@/features/auth/hooks';
import { AUTH_MESSAGES } from '@/features/auth/constants';
import styles from './EmailVerificationPage.module.css';

export default function EmailVerificationPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const hasCalledRef = useRef(false);

    const verifyMutation = useVerifyEmail();

    useEffect(() => {
        // Prevent double-call in StrictMode and on re-renders
        if (token && !hasCalledRef.current) {
            hasCalledRef.current = true;
            verifyMutation.mutate(token, {
                onSuccess: () => {
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/auth');
                    }, 3000);
                }
            });
        }
         
        // Note: verifyMutation excluded from deps to prevent double API calls
        // Safe because hasCalledRef ensures single execution
    }, [token, navigate]);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {verifyMutation.isPending && (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Verifying your email...</p>
                    </div>
                )}

                {verifyMutation.isSuccess && (
                    <div className={styles.success}>
                        <div className={styles.successIcon}>✓</div>
                        <h1 className={styles.title}>Email Verified</h1>
                        <p className={styles.message}>
                            Your email has been verified successfully!
                        </p>
                        <p className={styles.subtext}>
                            Redirecting to sign in page...
                        </p>
                    </div>
                )}

                {verifyMutation.isError && (
                    <div className={styles.error}>
                        <div className={styles.errorIcon}>✕</div>
                        <h1 className={styles.title}>Verification Failed</h1>
                        <p className={styles.message}>
                            {verifyMutation.error?.message || AUTH_MESSAGES.EMAIL_VERIFICATION_FAILED}
                        </p>
                        <button
                            onClick={() => navigate('/auth')}
                            className={styles.button}
                        >
                            Back to sign in
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
