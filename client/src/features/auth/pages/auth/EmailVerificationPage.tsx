import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '@/features/auth/api/authService';
import styles from './EmailVerificationPage.module.css';

export default function EmailVerificationPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                if (!token) {
                    setError('Verification token is missing');
                    setLoading(false);
                    return;
                }

                await authService.verifyEmail(token);
                setSuccess(true);

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/auth');
                }, 3000);
            } catch (err: any) {
                setError(err.message || 'Email verification failed. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [token, navigate]);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {loading && (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Verifying your email...</p>
                    </div>
                )}

                {success && (
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

                {error && (
                    <div className={styles.error}>
                        <div className={styles.errorIcon}>✕</div>
                        <h1 className={styles.title}>Verification Failed</h1>
                        <p className={styles.message}>{error}</p>
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
