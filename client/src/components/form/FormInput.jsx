import PropTypes from 'prop-types';
import styles from './FormInput.module.css';

/**
 * Reusable Input Component
 * @param {String} label - Label text
 * @param {String} type - Input type (text, email, password, etc)
 * @param {String} name - Input name attribute
 * @param {String} value - Input value
 * @param {Function} onChange - Change handler
 * @param {String} placeholder - Placeholder text
 * @param {String} error - Error message (if any)
 * @param {Boolean} required - Is field required
 * @param {String} className - Additional CSS class
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
}) => {
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

FormInput.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  autoComplete: PropTypes.string,
};

export default FormInput;
