import { useState, ChangeEvent, FormEvent } from 'react';
import { useUpdateProfile, useChangePassword } from '@/features/user/hooks';
import { validateUserProfile, validateChangePassword } from '@/features/user/utils';
import FormError from '@/shared/components/form/FormError';
import type { PersonalDetailsProps } from '@/features/user/types';
import type { ApiError } from '@/shared/types';
import styles from './PersonalDetails.module.css';

/**
 * Personal Details Component
 * Allows users to edit their personal information and password
 * 
 * Features:
 * - Zod validation for all fields
 * - Optimistic updates via React Query
 * - Loading states with visual feedback
 * - Error handling with toast notifications
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

    // Hooks - Now from user feature, not auth
    const updateProfileMutation = useUpdateProfile();
    const changePasswordMutation = useChangePassword();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear field error when user types
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
        // Clear field error when user types
        if (passwordErrors[name]) {
            setPasswordErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleUpdateProfile = (e: FormEvent) => {
        e.preventDefault();

        // Validate with Zod schema
        const validation = validateUserProfile(formData);

        if (!validation.success) {
            // Map Zod errors to fieldErrors state
            const errors: Record<string, string> = {};
            validation.error.issues.forEach((err) => {
                const field = err.path[0];
                if (typeof field === 'string') {
                    errors[field] = err.message;
                }
            });
            setFieldErrors(errors);
            return;
        }

        // Submit validated data
        updateProfileMutation.mutate(validation.data);
    };

    const handleChangePassword = (e: FormEvent) => {
        e.preventDefault();

        // Validate with Zod schema
        const validation = validateChangePassword(passwordData);

        if (!validation.success) {
            // Map Zod errors to passwordErrors state
            const errors: Record<string, string> = {};
            validation.error.issues.forEach((err) => {
                const field = err.path[0];
                if (typeof field === 'string') {
                    errors[field] = err.message;
                }
            });
            setPasswordErrors(errors);
            return;
        }

        // Submit validated data (only currentPassword and newPassword)
        changePasswordMutation.mutate({
            currentPassword: validation.data.currentPassword,
            newPassword: validation.data.newPassword,
        }, {
            onSuccess: () => {
                // Reset form on success
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
            {/* Error Messages - Display inline errors from API */}
            {updateProfileMutation.isError && (
                <FormError
                    message={(updateProfileMutation.error as ApiError)?.message || 'Failed to update profile'}
                />
            )}
            {changePasswordMutation.isError && (
                <FormError
                    message={(changePasswordMutation.error as ApiError)?.message || 'Failed to change password'}
                />
            )}

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
                                className={`${styles.input} ${styles.inputDisabled}`}
                            />
                            <p className={styles.helperText}>
                                To update your email, please contact our Customer Support team
                            </p>
                        </div>
                    </div>

                    {/* Save Button with Loading State */}
                    <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className={styles.saveBtn}
                    >
                        {updateProfileMutation.isPending ? (
                            <>
                                <span className={styles.spinner} />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
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
                        </div>(
                        <>
                            <span className={styles.spinner} />
                            Changing...
                        </>
                        ) : (
                        'Change password'
                        )

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
