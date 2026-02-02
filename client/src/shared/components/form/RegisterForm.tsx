import { useState, ChangeEvent, FormEvent } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import FormInput from './FormInput';
import FormButton from './FormButton';
import FormError from './FormError';
import styles from './RegisterForm.module.css';

interface RegisterFormData {
    username: string;
    email: string;
    phone: string;
    password: string;
}

interface RegisterFormProps {
    onSubmit: (data: RegisterFormData) => void;
    onGoogleLogin?: (credential: string | undefined) => void;
    onBack?: () => void;
    loading?: boolean;
    error?: string;
}

/**
 * Register Form Component
 */
const RegisterForm = ({ onSubmit, onGoogleLogin, onBack, loading = false, error = '' }: RegisterFormProps) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
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

        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^\w+([-.]?\w+)*@\w+([-.]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
            errors.email = 'Invalid email address';
        }

        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^(\+84|0)[0-9]{9,10}$/.test(formData.phone)) {
            errors.phone = 'Invalid phone number format';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
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

        onSubmit({
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
        });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formHeader}>
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className={styles.backButton}
                        title="Back to login"
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}
                <h2 className={styles.formTitle}>Sign Up</h2>
            </div>

            {error && <FormError message={error} />}

            <FormInput
                label="Username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                error={fieldErrors.username || ''}
                required
            />

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
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+84 or 0 followed by 9-10 digits"
                error={fieldErrors.phone || ''}
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
                autoComplete="new-password"
                required
            />

            <FormInput
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                error={fieldErrors.confirmPassword || ''}
                autoComplete="new-password"
                required
            />

            <FormButton
                type="submit"
                disabled={loading}
                loading={loading}
                variant="primary"
            >
                Sign Up
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
                        text="signup_with"
                        locale="en_US"
                        size="medium"
                    />
                </div>
            )}
        </form>
    );
};

export default RegisterForm;
