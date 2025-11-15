import { useState } from 'react';
import PropTypes from 'prop-types';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import FormInput from './FormInput';
import FormButton from './FormButton';
import FormError from './FormError';
import styles from './LoginForm.module.css';

/**
 * Login Form Component
 * @param {Function} onSubmit - Form submission handler
 * @param {Function} onForgotPassword - Forgot password handler
 * @param {Function} onGoogleLogin - Google OAuth handler
 * @param {Function} onSwitchToRegister - Switch to register page
 * @param {Boolean} loading - Is form loading
 * @param {String} error - Error message
 */
const LoginForm = ({ onSubmit, onForgotPassword, onGoogleLogin, onSwitchToRegister, loading = false, error = '' }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
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
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Mật khẩu không được để trống';
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <FormError message={error} />}

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
        label="Mật khẩu"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Nhập mật khẩu"
        error={fieldErrors.password || ''}
        autoComplete="current-password"
        required
      />

      <button
        type="button"
        onClick={onForgotPassword}
        className={styles.forgotPasswordLink}
      >
        Quên mật khẩu?
      </button>

      <FormButton
        type="submit"
        disabled={loading}
        loading={loading}
        variant="primary"
      >
        Đăng nhập
      </FormButton>

      {/* Google OAuth */}
      {onGoogleLogin && (
        <div className={styles.divider}>
          <span>Hoặc</span>
        </div>
      )}
      {onGoogleLogin && (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
          <div className={styles.googleButtonWrapper}>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                onGoogleLogin(credentialResponse.credential);
              }}
              onError={() => console.log('Login Failed')}
              text="signin"
              locale="vi_VN"
            />
          </div>
        </GoogleOAuthProvider>
      )}

      {/* Register Link */}
      {onSwitchToRegister && (
        <div className={styles.registerLink}>
          <span>Chưa có tài khoản?</span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className={styles.switchButton}
          >
            Đăng ký ngay
          </button>
        </div>
      )}
    </form>
  );
};

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onForgotPassword: PropTypes.func.isRequired,
  onGoogleLogin: PropTypes.func,
  onSwitchToRegister: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default LoginForm;
