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
      errors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

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
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Enter your password"
        error={fieldErrors.password || ''}
        autoComplete="current-password"
        required
      />

      <button
        type="button"
        onClick={onForgotPassword}
        className={styles.forgotPasswordLink}
      >
        Forgot password?
      </button>

      <FormButton
        type="submit"
        disabled={loading}
        loading={loading}
        variant="primary"
      >
        Sign In
      </FormButton>

      {/* Google OAuth */}
      {onGoogleLogin && (
        <div className={styles.divider}>
          <span>Or</span>
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
              locale="en_US"
              size="compact"
            />
          </div>
        </GoogleOAuthProvider>
      )}

      {/* Register Link */}
      {onSwitchToRegister && (
        <div className={styles.registerLink}>
          <span>Don't have an account?</span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className={styles.switchButton}
          >
            Sign up now
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
