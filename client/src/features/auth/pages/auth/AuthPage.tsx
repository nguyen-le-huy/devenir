import { useState, memo } from 'react';
import { useAuthStore } from '@/core/stores/useAuthStore';
import LoginForm from '@/shared/components/form/LoginForm';
import RegisterForm from '@/shared/components/form/RegisterForm';
import ForgotPasswordForm from '@/shared/components/form/ForgotPasswordForm';
import PhoneVerificationForm from '@/shared/components/form/PhoneVerificationForm';
import authService from '@/features/auth/api/authService';
import styles from './AuthPage.module.css';

/**
 * AuthPage - 2-column auth layout (wrapped with Layout)
 * Left: Login Form
 * Right: Benefits (default) or Register Form or Forgot Password or Phone Verification
 */
const AuthPage = memo(() => {
    const login = useAuthStore((state) => state.login);

    // Form state: 'benefits', 'register', 'forgot', 'phone'
    const [rightForm, setRightForm] = useState<'benefits' | 'register' | 'forgot' | 'phone'>('benefits');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [googleCredential, setGoogleCredential] = useState<string | null>(null); // Store credential for phone verification

    // ==================== LOGIN HANDLERS ====================
    const handleLogin = async (data: any) => {
        setLoading(true);
        setError('');

        try {
            const response = await authService.login(data);
            login(response.token, response.user);
            window.location.href = '/';
        } catch (err: any) {
            const errorMessage = err.message || 'Login failed';
            setError(errorMessage);
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (credential: string | undefined) => {
        setLoading(true);
        setError('');

        try {
            const response = await authService.googleLogin(credential);
            login(response.token, response.user);
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'Google login failed');
            console.error('Google login error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ==================== REGISTER HANDLERS ====================
    const handleRegister = async (data: any) => {
        setLoading(true);
        setError('');

        try {
            await authService.register(data);
            // Registration successful but email verification required
            alert('Registration successful! Please check your email to verify your account. You will be redirected to login.');
            setRightForm('benefits'); // Reset form
            setTimeout(() => {
                window.location.href = '/auth'; // Redirect to login page
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
            console.error('Register error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async (credential: string | undefined) => {
        setLoading(true);
        setError('');

        try {
            const response = await authService.googleLogin(credential);

            // Check if user already exists or account just created
            if (response.user && response.token) {
                // Account already existed or verification not needed
                // Auto-login the user
                login(response.token, response.user);
                window.location.href = '/';
            } else {
                // New account created, show phone verification form
                setGoogleCredential(credential || null);
                setRightForm('phone');
            }
        } catch (err: any) {
            // If error is "user already exists", treat it as login
            if (err.message && (err.message.includes('already exists') || err.message.includes('already registered'))) {
                try {
                    const response = await authService.googleLogin(credential);
                    login(response.token, response.user);
                    window.location.href = '/';
                } catch (loginErr: any) {
                    setError(loginErr.message || 'Google registration failed');
                    console.error('Google register error:', loginErr);
                }
            } else {
                setError(err.message || 'Google registration failed');
                console.error('Google register error:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    // ==================== FORGOT PASSWORD HANDLERS ====================
    const handleForgotPassword = async (data: { email: string }) => {
        setLoading(true);
        setError('');

        try {
            await authService.forgotPassword(data);
            alert('Password reset email has been sent!');
            setRightForm('benefits');
        } catch (err: any) {
            setError(err.message || 'Error sending email');
            console.error('Forgot password error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setRightForm('benefits');
        setError('');
        setGoogleCredential(null);
    };

    // ==================== PHONE VERIFICATION HANDLERS ====================
    const handleAddPhone = async (data: { phone: string }) => {
        setLoading(true);
        setError('');

        try {
            const response = await authService.addPhone({
                phone: data.phone,
                googleToken: googleCredential
            });
            login(response.token, response.user);
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'Error adding phone number');
            console.error('Phone verification error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSkipPhone = async () => {
        setLoading(true);
        try {
            // For now, just login without phone
            const response = await authService.googleLogin(googleCredential as string);
            login(response.token, response.user);
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'Error during sign up');
            console.error('Skip phone error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authContent}>
                {/* LEFT COLUMN - LOGIN */}
                <div className={styles.leftColumn}>
                    <h2 className={styles.title}>Sign In</h2>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    {rightForm === 'benefits' ? (
                        <LoginForm
                            onSubmit={handleLogin}
                            onGoogleLogin={handleGoogleLogin}
                            onForgotPassword={() => setRightForm('forgot')}
                            onSwitchToRegister={() => setRightForm('register')}
                            loading={loading}
                            error=""
                        />
                    ) : (
                        <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
                            <LoginForm
                                onSubmit={handleLogin}
                                onGoogleLogin={handleGoogleLogin}
                                onForgotPassword={() => setRightForm('forgot')}
                                onSwitchToRegister={() => setRightForm('register')}
                                loading={loading}
                                error=""
                            />
                        </div>
                    )}
                </div>

                {/* DIVIDER */}
                <div className={styles.divider}></div>

                {/* RIGHT COLUMN - DYNAMIC CONTENT */}
                <div className={styles.rightColumn}>
                    {/* BENEFITS - Default View */}
                    {rightForm === 'benefits' && (
                        <div className={`${styles.benefitsWrapper} ${styles.slideIn}`}>
                            <h2 className={styles.title}>Sign Up</h2>
                            <div className={styles.benefitsList}>
                                <p className={styles.benefitIntro}>
                                    Create an account with us to enjoy exclusive benefits:
                                </p>
                                <ul className={styles.benefits}>
                                    <li className={styles.benefit}>
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Faster checkout with saved information</span>
                                    </li>
                                    <li className={styles.benefit}>
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Track orders and easily manage returns</span>
                                    </li>
                                    <li className={styles.benefit}>
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Discover the latest updates from Devenir</span>
                                    </li>
                                    <li className={styles.benefit}>
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Manage your profile and preferences</span>
                                    </li>
                                    <li className={styles.benefit}>
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Get expert support from our customer team</span>
                                    </li>
                                </ul>
                            </div>
                            <button
                                className={styles.createAccountBtn}
                                onClick={() => setRightForm('register')}
                            >
                                Create Account
                            </button>
                        </div>
                    )}

                    {/* REGISTER FORM */}
                    {rightForm === 'register' && (
                        <div className={`${styles.formWrapper} ${styles.slideIn}`}>
                            <RegisterForm
                                onSubmit={handleRegister}
                                onGoogleLogin={handleGoogleRegister}
                                onBack={() => setRightForm('benefits')}
                                loading={loading}
                                error={error}
                            />
                        </div>
                    )}

                    {/* FORGOT PASSWORD FORM */}
                    {rightForm === 'forgot' && (
                        <div className={`${styles.formWrapper} ${styles.slideIn}`}>
                            <ForgotPasswordForm
                                onSubmit={handleForgotPassword}
                                onBack={handleBackToLogin}
                                loading={loading}
                                error={error}
                                submitted={false}
                            />
                        </div>
                    )}

                    {rightForm === 'phone' && (
                        <div className={`${styles.formWrapper} ${styles.slideIn}`}>
                            <PhoneVerificationForm
                                onSubmit={handleAddPhone}
                                onSkip={handleSkipPhone}
                                loading={loading}
                                error={error}
                                onBack={handleSkipPhone}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

AuthPage.displayName = 'AuthPage';

export default AuthPage;
