import { useState } from 'react';
import PropTypes from 'prop-types';
import FormInput from './FormInput';
import FormButton from './FormButton';
import FormError from './FormError';
import styles from './PhoneVerificationForm.module.css';

/**
 * Phone Verification Form Component
 * Used after Google OAuth signup to collect phone number
 * @param {Function} onSubmit - Form submission handler
 * @param {Function} onSkip - Skip phone verification handler
 * @param {Boolean} loading - Is form loading
 * @param {String} error - Error message
 */
const PhoneVerificationForm = ({ onSubmit, onSkip, loading = false, error = '' }) => {
  const [phone, setPhone] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleChange = (e) => {
    setPhone(e.target.value);
    if (fieldError) {
      setFieldError('');
    }
  };

  const validateForm = () => {
    if (!phone.trim()) {
      return 'Phone number is required';
    }
    // Vietnamese phone validation: +84 or 0, followed by 9-10 digits
    if (!/^(\+84|0)[0-9]{9,10}$/.test(phone)) {
      return 'Invalid phone number format. Example: 0912345678 or +84912345678';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const error = validateForm();
    if (error) {
      setFieldError(error);
      return;
    }

    onSubmit({ phone });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formHeader}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={styles.backButton}
            title="Skip phone verification"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <h2 className={styles.formTitle}>Complete Registration</h2>
      </div>

      {error && <FormError message={error} />}

      <p className={styles.description}>
        Almost done! Please provide your phone number to complete registration.
      </p>

      <FormInput
        label="Phone Number"
        type="tel"
        name="phone"
        value={phone}
        onChange={handleChange}
        placeholder="+84 or 0 followed by 9-10 digits"
        error={fieldError}
        required
      />

      <FormButton
        type="submit"
        disabled={loading}
        loading={loading}
        variant="primary"
      >
        Complete
      </FormButton>

      <button
        type="button"
        onClick={onSkip}
        className={styles.skipButton}
      >
        Skip for now
      </button>
    </form>
  );
};

PhoneVerificationForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default PhoneVerificationForm;
