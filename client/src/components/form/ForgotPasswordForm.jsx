import { useState } from 'react';
import PropTypes from 'prop-types';
import FormInput from './FormInput';
import FormButton from './FormButton';
import FormError from './FormError';
import styles from './ForgotPasswordForm.module.css';

/**
 * Forgot Password Form Component
 * @param {Function} onSubmit - Form submission handler
 * @param {Function} onBack - Back to login handler
 * @param {Boolean} loading - Is form loading
 * @param {String} error - Error message
 * @param {Boolean} submitted - Has form been submitted successfully
 */
const ForgotPasswordForm = ({
  onSubmit,
  onBack,
  loading = false,
  error = '',
  submitted = false,
}) => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) {
      setFieldError('');
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      return 'Email không được để trống';
    }
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return 'Email không hợp lệ';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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
        <h3 className={styles.successTitle}>Email đã được gửi</h3>
        <p className={styles.successMessage}>
          Vui lòng kiểm tra email của bạn để reset mật khẩu. Link có hiệu lực trong 1 giờ.
        </p>
        <FormButton onClick={onBack} variant="primary">
          Quay lại đăng nhập
        </FormButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <FormError message={error} />}

      <p className={styles.description}>
        Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn reset mật khẩu
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
        Gửi hướng dẫn
      </FormButton>

      <button
        type="button"
        onClick={onBack}
        className={styles.backLink}
      >
        ← Quay lại đăng nhập
      </button>
    </form>
  );
};

ForgotPasswordForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  submitted: PropTypes.bool,
};

export default ForgotPasswordForm;
