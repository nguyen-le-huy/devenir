import { useState, FormEvent } from 'react';
import { useUpdatePreferences } from '@/features/auth/hooks';
import styles from './MarketingPreferences.module.css';

interface MarketingPreferencesProps {
    user: any; // Specify user type if available
}

/**
 * Marketing Preferences Component
 * Allows users to manage communication preferences
 */
export default function MarketingPreferences({ user }: MarketingPreferencesProps) {
    const updatePreferencesMutation = useUpdatePreferences();

    const [preferences, setPreferences] = useState({
        channels: {
            email: true,
            phone: false,
            messaging: false,
            post: false,
            ...(user?.preferences?.channels || {})
        },
        interests: user?.preferences?.interests || 'menswear',
    });

    const handleChannelChange = (channel: keyof typeof preferences.channels) => {
        setPreferences((prev) => ({
            ...prev,
            channels: {
                ...prev.channels,
                [channel]: !prev.channels[channel],
            },
        }));
    };

    const handleInterestChange = (interest: string) => {
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
            {/* Error/Success Messages handled by Toast mostly */}
            {updatePreferencesMutation.isError && (
                <div className={styles.errorMessage}>{(updatePreferencesMutation.error as any).message || 'Failed to update preferences'}</div>
            )}

            <form onSubmit={handleSavePreferences} className={styles.form}>
                {/* Communication Channel Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Channel</h2>
                    <p className={styles.sectionDescription}>
                        Tell us what channel you'd like to receive communications
                    </p>

                    <div className={styles.channelList}>
                        {Object.entries(preferences.channels).map(([channel, isSelected]) => (
                            <div key={channel} className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    id={`channel-${channel}`}
                                    checked={isSelected as boolean}
                                    onChange={() => handleChannelChange(channel as any)}
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
                                onChange={(e) => handleInterestChange(e.target.value)}
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
                                onChange={(e) => handleInterestChange(e.target.value)}
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
                                onChange={(e) => handleInterestChange(e.target.value)}
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

                {/* Save Button */}
                <button
                    type="submit"
                    disabled={updatePreferencesMutation.isPending}
                    className={styles.saveBtn}
                >
                    {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
