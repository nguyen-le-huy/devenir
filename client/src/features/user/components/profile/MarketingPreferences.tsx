import { useState, FormEvent } from 'react';
import { useUpdatePreferences } from '@/features/user/hooks';
import type { MarketingPreferencesProps, UserPreferences } from '@/features/user/types';
import type { ApiError } from '@/shared/types';
import styles from './MarketingPreferences.module.css';

/**
 * Marketing Preferences Component
 * Allows users to manage communication preferences
 * 
 * Features:
 * - Channel selection (email, phone, messaging, post)
 * - Interest preferences (menswear, womenswear, both)
 * - Optimistic updates via React Query
 * - Loading states with visual feedback
 */
export default function MarketingPreferences({ user }: MarketingPreferencesProps) {
    const updatePreferencesMutation = useUpdatePreferences();

    const [preferences, setPreferences] = useState<UserPreferences>({
        channels: {
            email: user?.preferences?.channels?.email ?? true,
            phone: user?.preferences?.channels?.phone ?? false,
            messaging: user?.preferences?.channels?.messaging ?? false,
            post: user?.preferences?.channels?.post ?? false,
        },
        interests: user?.preferences?.interests || 'menswear',
    });

    const handleChannelChange = (channel: keyof UserPreferences['channels']) => {
        setPreferences((prev) => ({
            ...prev,
            channels: {
                ...prev.channels,
                [channel]: !prev.channels[channel],
            },
        }));
    };

    const handleInterestChange = (interest: UserPreferences['interests']) => {
        setPreferences((prev) => ({
            ...prev,
            interests: interest,
        }));
    };

    const handleSavePreferences = (e: FormEvent) => {
        e.preventDefault();
        updatePreferencesMutation.mutate(preferences);
    };

    const getChannelLabel = (channel: string) => {
        const labels: Record<string, string> = {
            email: 'Email',
            phone: 'Phone',
            messaging: 'Messaging Services',
            post: 'Post',
        };
        return labels[channel] || channel;
    };

    return (
        <div className={styles.preferences}>
            {/* Error Message - Display inline error from API */}
            {updatePreferencesMutation.isError && (
                <div className={styles.errorMessage}>
                    {(updatePreferencesMutation.error as ApiError)?.message || 'Failed to update preferences'}
                </div>
            )}

            <form onSubmit={handleSavePreferences} className={styles.form}>
                {/* Communication Channel Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Channel</h2>
                    <p className={styles.sectionDescription}>
                        Tell us what channel you'd like to receive communications
                    </p>

                    <div className={styles.channelList}>
                        {(Object.keys(preferences.channels) as Array<keyof UserPreferences['channels']>).map((channel) => (
                            <div key={channel} className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    id={`channel-${channel}`}
                                    checked={preferences.channels[channel]}
                                    onChange={() => handleChannelChange(channel)}
                                    className={styles.checkbox}
                                />
                                <label htmlFor={`channel-${channel}`} className={styles.checkboxLabel}>
                                    {getChannelLabel(channel)}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interests Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Interests</h2>
                    <p className={styles.sectionDescription}>
                        Tell us what you love and we'll personalise what we send according to your interests
                    </p>

                    <div className={styles.interestsList}>
                        <div className={styles.radioGroup}>
                            <input
                                type="radio"
                                id="interest-womenswear"
                                name="interests"
                                value="womenswear"
                                checked={preferences.interests === 'womenswear'}
                                onChange={(e) => handleInterestChange(e.target.value as 'menswear' | 'womenswear' | 'both')}
                                className={styles.radio}
                            />
                            <label htmlFor="interest-womenswear" className={styles.radioLabel}>
                                Womenswear
                            </label>
                        </div>

                        <div className={styles.radioGroup}>
                            <input
                                type="radio"
                                id="interest-menswear"
                                name="interests"
                                value="menswear"
                                checked={preferences.interests === 'menswear'}
                                onChange={(e) => handleInterestChange(e.target.value as 'menswear' | 'womenswear' | 'both')}
                                className={styles.radio}
                            />
                            <label htmlFor="interest-menswear" className={styles.radioLabel}>
                                Menswear
                            </label>
                        </div>

                        <div className={styles.radioGroup}>
                            <input
                                type="radio"
                                id="interest-both"
                                name="interests"
                                value="both"
                                checked={preferences.interests === 'both'}
                                onChange={(e) => handleInterestChange(e.target.value as 'menswear' | 'womenswear' | 'both')}
                                className={styles.radio}
                            />
                            <label htmlFor="interest-both" className={styles.radioLabel}>
                                Both
                            </label>
                        </div>
                    </div>
                </div>

                {/* Privacy Notice */}
                <div className={styles.section}>
                    <p className={styles.privacyText}>
                        When you subscribe, you confirm you have read Devenir's{' '}
                        <a href="#" className={styles.link}>Privacy Policy</a>. You may opt out of receiving updates at any time by using the unsubscribe link in the emails or by{' '}
                        <a href="#" className={styles.link}>contacting us for assistance</a>. Devenir uses your personal information to offer enhanced customer services tailored to your preferences. You provide your personal information voluntarily and Devenir can only send you updates with your consent.
                    </p>
                </div>

                {/* Save Button with Loading State */}
                <button
                    type="submit"
                    disabled={updatePreferencesMutation.isPending}
                    className={styles.saveBtn}
                >
                    {updatePreferencesMutation.isPending ? (
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
    );
}
