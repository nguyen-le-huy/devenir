import PropTypes from 'prop-types';
import styles from './FormError.module.css';

/**
 * Display form-level error messages
 * @param {String} message - Error message
 */
const FormError = ({ message }) => {
  if (!message) return null;

  return (
    <div className={styles.errorContainer}>
      <span className={styles.errorIcon}>!</span>
      <p className={styles.errorMessage}>{message}</p>
    </div>
  );
};

FormError.propTypes = {
  message: PropTypes.string,
};

export default FormError;
