
import { useState, ChangeEvent, FormEvent } from 'react';
import { useUpdateProfile, useChangePassword } from '@/features/auth/hooks';
import FormError from '@/shared/components/form/FormError';
import styles from './PersonalDetails.module.css';

interface PersonalDetailsProps {
    user: any;
}

/**
 * Personal Details Component
 * Allows users to edit their personal information and password
 */
export default function PersonalDetails({ user }: PersonalDetailsProps) {

    // Form States
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        birthday: user?.birthday ? user.birthday.split('T')[0] : '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    // Hooks
    const updateProfileMutation = useUpdateProfile();
    const changePasswordMutation = useChangePassword();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (passwordErrors[name]) {
            setPasswordErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateProfileForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        }

        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^(\+84|0)[0-9]{9,10}$/.test(formData.phone)) {
            errors.phone = 'Invalid phone number format';
        }

        return errors;
    };

    const validatePasswordForm = () => {
        const errors: Record<string, string> = {};

        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }

        if (!passwordData.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 6) {
            errors.newPassword = 'Password must be at least 6 characters';
        }

        if (!passwordData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        return errors;
    };

    const handleUpdateProfile = (e: FormEvent) => {
        e.preventDefault();
        const errors = validateProfileForm();

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }


        updateProfileMutation.mutate(formData);
    };

    const handleChangePassword = (e: FormEvent) => {
        e.preventDefault();
        const errors = validatePasswordForm();

        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }

        changePasswordMutation.mutate({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
        }, {
            onSuccess: () => {
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                setShowPasswordSection(false);
            }
        });
    };

    return (
        <div className={styles.personalDetails}>
            {/* Error/Success Messages managed by Toast mostly, but inline error if needed */}
            {updateProfileMutation.isError && <FormError message={(updateProfileMutation.error as any).message || 'Failed to update profile'} />}
            {changePasswordMutation.isError && <FormError message={(changePasswordMutation.error as any).message || 'Failed to change password'} />}

            {/* Personal Information Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Personal Information</h2>
                <p className={styles.sectionSubtitle}>* Required Field</p>

                <form onSubmit={handleUpdateProfile} className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Username *</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`${styles.input} ${fieldErrors.username ? styles.inputError : ''} `}
                                placeholder="Enter your username"
                            />
                            {fieldErrors.username && (
                                <span className={styles.errorText}>{fieldErrors.username}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter your first name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter your last name"
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Birthday</label>
                            <input
                                type="date"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''} `}
                                placeholder="+84 or 0 followed by 9-10 digits"
                            />
                            {fieldErrors.phone && (
                                <span className={styles.errorText}>{fieldErrors.phone}</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className={`${styles.input} ${styles.inputDisabled} `}
                            />
                            <p className={styles.helperText}>
                                To update your email, please contact our Customer Support team
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className={styles.saveBtn}
                    >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Password Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Password</h2>

                {!showPasswordSection ? (
                    <div className={styles.passwordInfo}>
                        <div className={styles.passwordDisplay}>
                            <span>•••••••••••</span>
                        </div>
                        <button
                            type="button"
                            className={styles.changePasswordBtn}
                            onClick={() => setShowPasswordSection(true)}
                        >
                            Change password
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleChangePassword} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className={`${styles.input} ${passwordErrors.currentPassword ? styles.inputError : ''} `}
                                placeholder="Enter your current password"
                            />
                            {passwordErrors.currentPassword && (
                                <span className={styles.errorText}>{passwordErrors.currentPassword}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className={`${styles.input} ${passwordErrors.newPassword ? styles.inputError : ''} `}
                                placeholder="Enter your new password"
                            />
                            {passwordErrors.newPassword && (
                                <span className={styles.errorText}>{passwordErrors.newPassword}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className={`${styles.input} ${passwordErrors.confirmPassword ? styles.inputError : ''} `}
                                placeholder="Confirm your new password"
                            />
                            {passwordErrors.confirmPassword && (
                                <span className={styles.errorText}>{passwordErrors.confirmPassword}</span>
                            )}
                        </div>

                        <div className={styles.passwordActions}>
                            <button
                                type="submit"
                                disabled={changePasswordMutation.isPending}
                                className={styles.changePasswordSubmitBtn}
                            >
                                {changePasswordMutation.isPending ? 'Changing...' : 'Change password'}
                            </button>

                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={() => {
                                    setShowPasswordSection(false);
                                    setPasswordData({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: '',
                                    });
                                    setPasswordErrors({});
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
