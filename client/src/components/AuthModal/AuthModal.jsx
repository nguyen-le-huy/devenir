import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../form/LoginForm';
import ForgotPasswordForm from '../form/ForgotPasswordForm';
import authService from '../../services/authService';
import styles from './AuthModal.module.css';

/**
 * AuthModal - Modal version of auth page
 * Shows login and forgot password forms
 * Registration moved to separate /register page
 */
export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeForm, setActiveForm] = useState('login'); // 'login', 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);

  if (!isOpen) return null;

  // ============ LOGIN HANDLER ============
  const handleLogin = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(data);

      // Update AuthContext state
      login(response.token, response.user);

      // Close modal after successful login
      onClose();
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============ GOOGLE LOGIN HANDLER ============
  const handleGoogleLogin = async (credential) => {
    setLoading(true);
    setError('');

    try {
      const response = await authService.googleLogin(credential);

      // Update AuthContext state
      login(response.token, response.user);

      // Close modal after successful Google login
      onClose();
    } catch (err) {
      setError(err.message || 'Google đăng nhập thất bại');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============ FORGOT PASSWORD HANDLER ============
  const handleForgotPassword = async (data) => {
    setLoading(true);
    setError('');

    try {
      await authService.forgotPassword(data);
      setForgotPasswordSubmitted(true);
    } catch (err) {
      setError(err.message || 'Gửi email thất bại');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============ FORM SWITCHERS ============
  const switchToLogin = () => {
    setActiveForm('login');
    setError('');
    setForgotPasswordSubmitted(false);
  };

  const switchToForgotPassword = () => {
    setActiveForm('forgot');
    setError('');
    setForgotPasswordSubmitted(false);
  };

  const switchToRegister = () => {
    onClose();
    navigate('/register');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        {/* Close Button */}
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Devenir</h1>
          <p className={styles.subtitle}>
            {activeForm === 'login' && 'Đăng nhập vào tài khoản'}
            {activeForm === 'register' && 'Tạo tài khoản mới'}
            {activeForm === 'forgot' && 'Khôi phục mật khẩu'}
          </p>
        </div>

        {/* Forms */}
        <div className={styles.formContainer}>
          {activeForm === 'login' && (
            <div className={styles.formWrapper}>
              <LoginForm
                onSubmit={handleLogin}
                onForgotPassword={switchToForgotPassword}
                onGoogleLogin={handleGoogleLogin}
                onSwitchToRegister={switchToRegister}
                loading={loading}
                error={error}
              />
            </div>
          )}

          {activeForm === 'forgot' && (
            <div className={styles.formWrapper}>
              {!forgotPasswordSubmitted ? (
                <>
                  <ForgotPasswordForm
                    onSubmit={handleForgotPassword}
                    loading={loading}
                    error={error}
                  />
                  <div className={styles.switchForm}>
                    <button
                      type="button"
                      onClick={switchToLogin}
                      className={styles.switchButton}
                    >
                      ← Quay lại đăng nhập
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.successMessage}>
                  <h3>✓ Email đã được gửi</h3>
                  <p>Vui lòng kiểm tra email của bạn để đặt lại mật khẩu.</p>
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className={styles.primaryButton}
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
