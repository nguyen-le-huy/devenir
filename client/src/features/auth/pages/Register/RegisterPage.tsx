import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/useAuthStore';
import RegisterForm from '@/shared/components/form/RegisterForm';
import { useRegister, useGoogleAuth } from '@/features/auth/hooks';
import { RegisterData, AuthResponse } from '@/features/auth/types';
import styles from './RegisterPage.module.css';

/**
 * RegisterPage - Full-page registration with background
 * Separate page for registration flow
 */
export default function RegisterPage() {
    const navigate = useNavigate();
    const loginToStore = useAuthStore((state) => state.login);

    // Hooks
    const registerMutation = useRegister();
    const googleAuthMutation = useGoogleAuth();

    const handleRegister = (data: RegisterData) => {
        registerMutation.mutate(data, {
            onSuccess: (response: AuthResponse) => {
                if (response.token && response.user) {
                    loginToStore(response.token, response.user);
                    navigate('/');
                    toast.success(`Welcome, ${response.user.firstName || 'User'}!`);
                } else {
                    // Verification flow
                    toast.success('Registration successful! Please check your email to verify your account.');
                    navigate('/auth'); // Redirect to login
                }
            },
            onError: () => {
                // Toast handled by hook usually
            }
        });
    };

    const handleGoogleLogin = (credential: string | undefined) => {
        if (!credential) return;

        googleAuthMutation.mutate(credential, {
            onSuccess: (response: any) => {
                loginToStore(response.token, response.user);
                navigate('/');
                toast.success(`Welcome, ${response.user.firstName || 'User'}!`);
            },
            onError: (err: any) => {
                toast.error(err?.message || 'Google registration failed');
            }
        });
    };

    const handleSwitchToLogin = () => {
        navigate('/auth');
    };

    return (
        <div className={styles.registerPageContainer}>
            <div className={styles.registerCard}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>Devenir</h1>
                    <p className={styles.subtitle}>Tạo tài khoản mới</p>
                </div>

                {/* Form */}
                <div className={styles.formContainer}>
                    <RegisterForm
                        onSubmit={handleRegister}
                        onGoogleLogin={handleGoogleLogin}
                        loading={registerMutation.isPending || googleAuthMutation.isPending}
                        error={registerMutation.error ? (registerMutation.error as any).message : ''}
                        onBack={handleSwitchToLogin}
                    />
                    <div className={styles.switchForm}>
                        <span>Đã có tài khoản?</span>
                        <button
                            type="button"
                            onClick={handleSwitchToLogin}
                            className={styles.switchButton}
                        >
                            Đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
