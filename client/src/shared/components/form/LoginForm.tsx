import { useState, ChangeEvent, FormEvent } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import FormInput from './FormInput';
import FormButton from './FormButton';
import FormError from './FormError';
import styles from './LoginForm.module.css';

interface LoginFormProps {
    onSubmit: (data: any) => void;
    onForgotPassword: () => void;
    onGoogleLogin?: (credential: string | undefined) => void;
    onSwitchToRegister?: () => void;
    loading?: boolean;
    error?: string;
}

/**
 * Login Form Component
 */
const LoginForm = ({ onSubmit, onForgotPassword, onGoogleLogin, onSwitchToRegister, loading = false, error = '' }: LoginFormProps) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
            errors.email = 'Invalid email address';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        }

        return errors;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <FormError message={error} />}

            <FormInput
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                error={fieldErrors.email || ''}
                required
            />

            <FormInput
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                error={fieldErrors.password || ''}
                autoComplete="current-password"
                required
            />

            <button
                type="button"
                onClick={onForgotPassword}
                className={styles.forgotPasswordLink}
            >
                Forgot password?
            </button>

            <FormButton
                type="submit"
                disabled={loading}
                loading={loading}
                variant="primary"
            >
                Sign In
            </FormButton>

            {/* Google OAuth */}
            {onGoogleLogin && (
                <div className={styles.divider}>
                    <span>Or</span>
                </div>
            )}
            {onGoogleLogin && (
                <div className={styles.googleButtonWrapper}>
                    <GoogleLogin
                        onSuccess={(credentialResponse) => {
                            onGoogleLogin(credentialResponse.credential);
                        }}
                        onError={() => { }}
                        text="signin"
                        locale="en_US"
                        size="medium"
                    />
                </div>
            )}

            {/* Register Link */}
            {onSwitchToRegister && (
                <div className={styles.registerLink}>
                    <span>Don't have an account?</span>
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className={styles.switchButton}
                    >
                        Sign up now
                    </button>
                </div>
            )}
        </form>
    );
};

export default LoginForm;
