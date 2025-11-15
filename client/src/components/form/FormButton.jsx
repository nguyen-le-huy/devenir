import PropTypes from 'prop-types';
import styles from './FormButton.module.css';

/**
 * Reusable Button Component
 * @param {String} children - Button text
 * @param {Function} onClick - Click handler
 * @param {String} type - Button type (button, submit, reset)
 * @param {Boolean} disabled - Is button disabled
 * @param {Boolean} loading - Is button in loading state
 * @param {String} variant - Button variant (primary, secondary, outline, danger)
 * @param {String} size - Button size (sm, md, lg)
 * @param {String} className - Additional CSS class
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
}) => {
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

FormButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default FormButton;
