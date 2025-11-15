import { useState } from 'react';
import PropTypes from 'prop-types';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import FormInput from './FormInput';
import FormButton from './FormButton';
import FormError from './FormError';
import styles from './RegisterForm.module.css';

/**
 * Register Form Component
 * @param {Function} onSubmit - Form submission handler
 * @param {Function} onGoogleLogin - Google OAuth handler
 * @param {Boolean} loading - Is form loading
 * @param {String} error - Error message
 */
const RegisterForm = ({ onSubmit, onGoogleLogin, loading = false, error = '' }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (!formData.username.trim()) {
      errors.username = 'Username không được để trống';
    } else if (formData.username.length < 3) {
      errors.username = 'Username phải ít nhất 3 ký tự';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
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

    onSubmit({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <FormError message={error} />}

      <FormInput
        label="Username"
        type="text"
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="Nhập username"
        error={fieldErrors.username || ''}
        required
      />

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
        autoComplete="new-password"
        required
      />

      <FormInput
        label="Xác nhận mật khẩu"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Xác nhận mật khẩu"
        error={fieldErrors.confirmPassword || ''}
        autoComplete="new-password"
        required
      />

      <FormButton
        type="submit"
        disabled={loading}
        loading={loading}
        variant="primary"
      >
        Đăng ký
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
              text="signup"
              locale="vi_VN"
            />
          </div>
        </GoogleOAuthProvider>
      )}
    </form>
  );
};

RegisterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onGoogleLogin: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default RegisterForm;
