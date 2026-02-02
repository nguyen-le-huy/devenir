import { useState, FormEvent, ChangeEvent } from 'react';
import FormInput from './FormInput';
import FormButton from './FormButton';
import FormError from './FormError';
import styles from './ForgotPasswordForm.module.css';

interface ForgotPasswordFormProps {
    onSubmit: (data: { email: string }) => void;
    onBack: () => void;
    loading?: boolean;
    error?: string;
    submitted?: boolean;
}

/**
 * Forgot Password Form Component
 */
const ForgotPasswordForm = ({
    onSubmit,
    onBack,
    loading = false,
    error = '',
    submitted = false,
}: ForgotPasswordFormProps) => {
    const [email, setEmail] = useState('');
    const [fieldError, setFieldError] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (fieldError) {
            setFieldError('');
        }
    };

    const validateForm = () => {
        if (!email.trim()) {
            return 'Email is required';
        }
        if (!/^\w+([-.]?\w+)*@\w+([-.]?\w+)*(\.\w{2,3})+$/.test(email)) {
            return 'Invalid email address';
        }
        return '';
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const error = validateForm();
        if (error) {
            setFieldError(error);
            return;
        }

        onSubmit({ email });
    };

    if (submitted) {
        return (
            <div className={styles.successContainer}>
                <div className={styles.successIcon}>✓</div>
                <h3 className={styles.successTitle}>Email sent</h3>
                <p className={styles.successMessage}>
                    Please check your email to reset your password. The link is valid for 1 hour.
                </p>
                <FormButton onClick={onBack} variant="primary">
                    Back to sign in
                </FormButton>
            </div>
        );
    }

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
                <h2 className={styles.formTitle}>Forgot Password</h2>
            </div>

            {error && <FormError message={error} />}

            <p className={styles.description}>
                Enter your email and we'll send you instructions to reset your password
            </p>

            <FormInput
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="example@email.com"
                error={fieldError}
                required
            />

            <FormButton
                type="submit"
                disabled={loading}
                loading={loading}
                variant="primary"
            >
                Send recover email
            </FormButton>

            <button
                type="button"
                onClick={onBack}
                className={styles.backLink}
            >
                ← Back to sign up
            </button>
        </form>
    );
};

export default ForgotPasswordForm;
