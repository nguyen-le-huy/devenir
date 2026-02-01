import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/shared/components/form/LoginForm';
import RegisterForm from '@/shared/components/form/RegisterForm';
import ForgotPasswordForm from '@/shared/components/form/ForgotPasswordForm';
import PhoneVerificationForm from '@/shared/components/form/PhoneVerificationForm';
import {
    useLogin,
    useRegister,
    useGoogleAuth,
    useAddPhone,
    useForgotPassword
} from '@/features/auth/hooks';
import { LoginData, RegisterData, AuthResponse } from '@/features/auth/types';
import { AUTH_MESSAGES } from '@/features/auth/constants';
import styles from './AuthPage.module.css';
import { toast } from 'sonner';

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

    // Hooks
    const loginMutation = useLogin();
    const registerMutation = useRegister();
    const googleAuthMutation = useGoogleAuth();
    const addPhoneMutation = useAddPhone();
    const forgotPasswordMutation = useForgotPassword();

    // ==================== LOGIN HANDLERS ====================
    const handleLogin = (data: LoginData) => {
        loginMutation.mutate(data, {
            onSuccess: () => {
                toast.success(AUTH_MESSAGES.LOGIN_SUCCESS);
                navigate('/');
            },
            onError: (error) => {
                toast.error(error.message || AUTH_MESSAGES.LOGIN_FAILED);
            }
        });
    };

    const handleGoogleLogin = (credential: string | undefined) => {
        if (!credential) return;

        googleAuthMutation.mutate(credential, {
            onSuccess: () => {
                toast.success(AUTH_MESSAGES.LOGIN_SUCCESS);
                navigate('/');
            },
            onError: (error) => {
                toast.error(error.message || AUTH_MESSAGES.GOOGLE_LOGIN_FAILED);
            }
        });
    };

    // ==================== REGISTER HANDLERS ====================
    const handleRegister = (data: RegisterData) => {
        registerMutation.mutate(data, {
            onSuccess: () => {
                toast.success(AUTH_MESSAGES.REGISTER_SUCCESS);
                setRightForm('benefits');
            }
        });
    };

    const handleGoogleRegister = (credential: string | undefined) => {
        if (!credential) return;

        googleAuthMutation.mutate(credential, {
            onSuccess: (response: AuthResponse) => {
                if (response.user && response.token) {
                    toast.success(AUTH_MESSAGES.REGISTER_SUCCESS_IMMEDIATE);
                    navigate('/');
                }
            },
            onError: (error) => {
                if (error.message?.includes('already exists')) {
                    // User already exists scenario
                }
                toast.error(error.message || AUTH_MESSAGES.GOOGLE_REGISTER_FAILED);
            }
        });
    };

    // ==================== FORGOT PASSWORD ====================
    const handleForgotPassword = (data: { email: string }) => {
        forgotPasswordMutation.mutate(data, {
            onSuccess: () => {
                setRightForm('benefits');
            }
        });
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
                            loading={loginMutation.isPending || (googleAuthMutation.isPending && !googleCredential)}
                            error={loginMutation.error?.message ?? ''}
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
                                    {[
                                        "Faster checkout with saved information",
                                        "Track orders and easily manage returns",
                                        "Discover the latest updates from Devenir",
                                        "Manage your profile and preferences",
                                        "Get expert support from our customer team"
                                    ].map((text, i) => (
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
                                onSubmit={handleRegister}
                                onGoogleLogin={handleGoogleRegister}
                                onBack={() => setRightForm('benefits')}
                                loading={registerMutation.isPending}
                                error={registerMutation.error?.message ?? ''}
                            />
                        </div>
                    )}

                    {/* FORGOT PASSWORD FORM */}
                    {rightForm === 'forgot' && (
                        <div className={`${styles.formWrapper} ${styles.slideIn}`}>
                            <ForgotPasswordForm
                                onSubmit={handleForgotPassword}
                                onBack={handleBackToLogin}
                                loading={forgotPasswordMutation.isPending}
                                error={forgotPasswordMutation.error?.message ?? ''}
                                submitted={forgotPasswordMutation.isSuccess}
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
