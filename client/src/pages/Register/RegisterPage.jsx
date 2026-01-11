import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import RegisterForm from '../../components/form/RegisterForm';
import authService from '../../services/authService';
import styles from './RegisterPage.module.css';

/**
 * RegisterPage - Full-page registration with background
 * Separate page for registration flow
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await authService.register(data);

      // Update Auth Store
      login(response.token, response.user);

      // Redirect to home
      navigate('/');
      toast.success(`Welcome, ${response.user.firstName || 'User'}!`);
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credential) => {
    setLoading(true);
    setError('');

    try {
      const response = await authService.googleLogin(credential);

      // Update Auth Store
      login(response.token, response.user);

      // Redirect to home
      navigate('/');
      toast.success(`Welcome, ${response.user.firstName || 'User'}!`);
    } catch (err) {
      toast.error(err.message || 'Google registration failed');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    navigate('/');
  };

  return (
    <div className={styles.registerPageContainer}>
      <div className={styles.registerCard}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Devenir</h1>
          <p className={styles.subtitle}>Tạo tài khoản mới</p>
        </div>

        {/* Form */}
        <div className={styles.formContainer}>
          <RegisterForm
            onSubmit={handleRegister}
            onGoogleLogin={handleGoogleLogin}
            loading={loading}
            error={error}
          />
          <div className={styles.switchForm}>
            <span>Đã có tài khoản?</span>
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className={styles.switchButton}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
