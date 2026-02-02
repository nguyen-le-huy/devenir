import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/shared/components/form/LoginForm';
import RegisterForm from '@/shared/components/form/RegisterForm';
import ForgotPasswordForm from '@/shared/components/form/ForgotPasswordForm';
import PhoneVerificationForm from '@/shared/components/form/PhoneVerificationForm';
import {
    useAddPhone,
    useGoogleAuth,
    useAuthActions
} from '@/features/auth/hooks';
import { SIGNUP_BENEFITS } from '@/features/auth/constants';
import styles from './AuthPage.module.css';

/**
 * AuthPage - 2-column auth layout (wrapped with Layout)
 * Left: Login Form
 * Right: Benefits (default) or Register Form or Forgot Password or Phone Verification
 */
const AuthPage = memo(() => {
    const navigate = useNavigate();
    // Form state: 'benefits', 'register', 'forgot', 'phone'
    const [rightForm, setRightForm] = useState<'benefits' | 'register' | 'forgot' | 'phone'>('benefits');
    const [googleCredential, setGoogleCredential] = useState<string | null>(null);

    // Auth actions hook (eliminates 70+ lines of duplicate handlers)
    const {
        handleLogin,
        handleGoogleLogin,
        handleRegister,
        handleGoogleRegister,
        handleForgotPassword,
        isLoginLoading,
        isRegisterLoading,
        isGoogleLoading,
        isForgotPasswordLoading,
        loginError,
        registerError
    } = useAuthActions();

    // Phone verification (separate from auth actions)
    const addPhoneMutation = useAddPhone();
    const googleAuthMutation = useGoogleAuth();

    // ==================== WRAPPED HANDLERS WITH LOCAL STATE ====================
    const handleRegisterWithReset = (data: any) => {
        handleRegister(data, false);
        setRightForm('benefits');
    };

    const handleForgotPasswordWithReset = (data: { email: string }) => {
        handleForgotPassword(data);
        setRightForm('benefits');
    };

    const handleBackToLogin = () => {
        setRightForm('benefits');
        setGoogleCredential(null);
    };

    // ==================== PHONE VERIFICATION ====================
    const handleAddPhone = (data: { phone: string }) => {
        addPhoneMutation.mutate({
            phone: data.phone,
            googleToken: googleCredential
        });
    };

    const handleSkipPhone = () => {
        if (googleCredential) {
            googleAuthMutation.mutate(googleCredential, {
                onSuccess: () => {
                    navigate('/');
                }
            });
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authContent}>
                {/* LEFT COLUMN - LOGIN */}
                <div className={styles.leftColumn}>
                    <h2 className={styles.title}>Sign In</h2>

                    <div style={rightForm !== 'benefits' ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                        <LoginForm
                            onSubmit={handleLogin}
                            onGoogleLogin={handleGoogleLogin}
                            onForgotPassword={() => setRightForm('forgot')}
                            onSwitchToRegister={() => setRightForm('register')}
                            loading={isLoginLoading || (isGoogleLoading && !googleCredential)}
                            error={loginError?.message ?? ''}
                        />
                    </div>
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
                                    {SIGNUP_BENEFITS.map((text, i) => (
                                        <li key={i} className={styles.benefit}>
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span>{text}</span>
                                        </li>
                                    ))}
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
                                onSubmit={handleRegisterWithReset}
                                onGoogleLogin={handleGoogleRegister}
                                onBack={() => setRightForm('benefits')}
                                loading={isRegisterLoading}
                                error={registerError?.message ?? ''}
                            />
                        </div>
                    )}

                    {/* FORGOT PASSWORD FORM */}
                    {rightForm === 'forgot' && (
                        <div className={`${styles.formWrapper} ${styles.slideIn}`}>
                            <ForgotPasswordForm
                                onSubmit={handleForgotPasswordWithReset}
                                onBack={handleBackToLogin}
                                loading={isForgotPasswordLoading}
                                error={registerError?.message ?? ''}
                                submitted={false}
                            />
                        </div>
                    )}

                    {/* PHONE FORM */}
                    {rightForm === 'phone' && (
                        <div className={`${styles.formWrapper} ${styles.slideIn}`}>
                            <PhoneVerificationForm
                                onSubmit={handleAddPhone}
                                onSkip={handleSkipPhone}
                                loading={addPhoneMutation.isPending}
                                error={addPhoneMutation.error?.message ?? ''}
                                onBack={handleBackToLogin}
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
