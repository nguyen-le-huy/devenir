import styles from './FormInput.module.css';

interface FormInputProps {
    label?: string;
    type?: string;
    name?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    className?: string;
    disabled?: boolean;
    autoComplete?: string;
}

/**
 * Reusable Input Component
 */
const FormInput = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder = '',
    error = '',
    required = false,
    className = '',
    disabled = false,
    autoComplete = 'off',
}: FormInputProps) => {
    return (
        <div className={`${styles.formGroup} ${className}`}>
            {label && (
                <label htmlFor={name} className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <input
                id={name}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                className={`${styles.input} ${error ? styles.inputError : ''}`}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default FormInput;
