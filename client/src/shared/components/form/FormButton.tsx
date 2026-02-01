import styles from './FormButton.module.css';
import { ReactNode } from 'react';

interface FormButtonProps {
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Reusable Button Component
 */
const FormButton = ({
    children,
    onClick,
    type = 'button',
    disabled = false,
    loading = false,
    variant = 'primary',
    size = 'md',
    className = '',
}: FormButtonProps) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
        >
            {loading ? (
                <>
                    <span className={styles.spinner}></span>
                    <span>{children}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default FormButton;
