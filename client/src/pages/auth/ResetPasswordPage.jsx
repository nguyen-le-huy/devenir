import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormInput from '../../components/form/FormInput';
import FormButton from '../../components/form/FormButton';
import FormError from '../../components/form/FormError';
import authService from '../../services/authService';
import styles from './ResetPasswordPage.module.css';

/**
 * Reset Password Page
 * User clicks link từ email và reset password
 */
const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
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

    if (!formData.newPassword) {
      errors.newPassword = 'Mật khẩu mới không được để trống';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu phải ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(token, {
        newPassword: formData.newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Reset mật khẩu thất bại');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Link không hợp lệ</h2>
          <p>Vui lòng truy cập link reset password từ email</p>
          <button onClick={() => navigate('/auth')} className={styles.backButton}>
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>Mật khẩu đã được reset thành công</h2>
          <p className={styles.successMessage}>
            Bạn sẽ được chuyển hướng đến trang đăng nhập
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Đặt lại mật khẩu</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <FormError message={error} />}

          <FormInput
            label="Mật khẩu mới"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Nhập mật khẩu mới"
            error={fieldErrors.newPassword || ''}
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
            Đặt lại mật khẩu
          </FormButton>
        </form>

        <button onClick={() => navigate('/auth')} className={styles.backLink}>
          ← Quay lại đăng nhập
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
