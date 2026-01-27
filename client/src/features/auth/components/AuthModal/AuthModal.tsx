import { useState } from 'react';
import { LoginData } from '@/features/auth/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/useAuthStore';
import LoginForm from '@/shared/components/form/LoginForm';
import ForgotPasswordForm from '@/shared/components/form/ForgotPasswordForm';
import { useLogin, useGoogleAuth, useForgotPassword } from '@/features/auth/hooks';
import styles from './AuthModal.module.css';
import Backdrop from '@/shared/components/Backdrop/Backdrop';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * AuthModal - Modal version of auth page
 * Shows login and forgot password forms
 * Registration moved to separate /register page
 */
export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const navigate = useNavigate();
    const loginToStore = useAuthStore((state) => state.login);
    const [activeForm, setActiveForm] = useState<'login' | 'forgot'>('login');
    const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);

    // Hooks
    const loginMutation = useLogin();
    const googleAuthMutation = useGoogleAuth();
    const forgotPasswordMutation = useForgotPassword();

    if (!isOpen) return null;

    // ============ LOGIN HANDLER ============
    const handleLogin = (data: LoginData) => {
        loginMutation.mutate(data, {
            onSuccess: () => {
                onClose();
            },
            onError: () => {
                // Toast handled by hook
            }
        });
    };

    // ============ GOOGLE LOGIN HANDLER ============
    const handleGoogleLogin = (credential: string | undefined) => {
        if (!credential) return;

        googleAuthMutation.mutate(credential, {
            onSuccess: (response: any) => {
                loginToStore(response.token, response.user);
                onClose();
                toast.success(`Welcome back, ${response.user.firstName || 'User'}!`);
            },
            onError: (err: any) => {
                toast.error(err?.message || 'Google login failed');
            }
        });
    };

    // ============ FORGOT PASSWORD HANDLER ============
    const handleForgotPassword = (data: { email: string }) => {
        forgotPasswordMutation.mutate(data, {
            onSuccess: () => {
                setForgotPasswordSubmitted(true);
            },
            onError: () => {
                // Toast handled by hook
            }
        });
    };

    // ============ FORM SWITCHERS ============
    const switchToLogin = () => {
        setActiveForm('login');
        setForgotPasswordSubmitted(false);
    };

    const switchToForgotPassword = () => {
        setActiveForm('forgot');
        setForgotPasswordSubmitted(false);
    };

    const switchToRegister = () => {
        onClose();
        navigate('/register');
    };

    return (
        <>
            <Backdrop isOpen={isOpen} onClick={onClose} />
            <div className={styles.modal}>
                {/* Close Button */}
                <button className={styles.closeButton} onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>Devenir</h1>
                    <p className={styles.subtitle}>
                        {activeForm === 'login' && 'Đăng nhập vào tài khoản'}
                        {activeForm === 'forgot' && 'Khôi phục mật khẩu'}
                    </p>
                </div>

                {/* Forms */}
                <div className={styles.formContainer}>
                    {activeForm === 'login' && (
                        <div className={styles.formWrapper}>
                            <LoginForm
                                onSubmit={handleLogin}
                                onForgotPassword={switchToForgotPassword}
                                onGoogleLogin={handleGoogleLogin}
                                onSwitchToRegister={switchToRegister}
                                loading={loginMutation.isPending || googleAuthMutation.isPending}
                                error={loginMutation.error ? (loginMutation.error as any).message : ''}
                            />
                        </div>
                    )}

                    {activeForm === 'forgot' && (
                        <div className={styles.formWrapper}>
                            {!forgotPasswordSubmitted ? (
                                <>
                                    <ForgotPasswordForm
                                        onSubmit={handleForgotPassword}
                                        onBack={switchToLogin}
                                        loading={forgotPasswordMutation.isPending}
                                        error={forgotPasswordMutation.error ? (forgotPasswordMutation.error as any).message : ''}
                                    />
                                </>
                            ) : (
                                <div className={styles.successMessage}>
                                    <h3>✓ Email đã được gửi</h3>
                                    <p>Vui lòng kiểm tra email của bạn để đặt lại mật khẩu.</p>
                                    <button
                                        type="button"
                                        onClick={switchToLogin}
                                        className={styles.primaryButton}
                                    >
                                        Quay lại đăng nhập
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
