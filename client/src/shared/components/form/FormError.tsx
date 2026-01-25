import styles from './FormError.module.css';

interface FormErrorProps {
    message?: string;
}

/**
 * Display form-level error messages
 */
const FormError = ({ message }: FormErrorProps) => {
    if (!message) return null;

    return (
        <div className={styles.errorContainer}>
            <span className={styles.errorIcon}>!</span>
            <p className={styles.errorMessage}>{message}</p>
        </div>
    );
};

export default FormError;
