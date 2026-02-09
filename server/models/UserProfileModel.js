import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * UserProfile Model
 * Stores personalization preferences and behavioral metrics
 * 
 * @module UserProfileModel
 * @version 3.0.0
 */

const userProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        preferences: {
            styleProfile: {
                type: [String],
                default: []
            },
            sizeHistory: {
                type: mongoose.Schema.Types.Mixed,
                default: {}
            },
            budgetRange: {
                min: {
                    type: Number,
                    default: 0
                },
                max: {
                    type: Number,
                    default: 10000000
                }
            },
            favoriteColors: {
                type: [String],
                default: []
            },
            favoriteBrands: {
                type: [String],
                default: []
            }
        },
        behaviorMetrics: {
            avgSessionLength: {
                type: Number,
                default: 0
            },
            productsViewedPerSession: {
                type: Number,
                default: 0
            },
            conversionRate: {
                type: Number,
                default: 0
            },
            lastPurchaseDate: Date
        },
        updatedAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// TTL index: auto-delete profiles inactive for 180 days (GDPR compliance)
userProfileSchema.index(
    { updatedAt: 1 },
    { expireAfterSeconds: 180 * 24 * 60 * 60 }
);

// Index for efficient queries
userProfileSchema.index({ userId: 1, updatedAt: -1 });

/**
 * Encrypt sensitive data (PII)
 * @param {Object} data - Data to encrypt
 * @returns {Object} Encrypted data with IV and auth tag
 */
userProfileSchema.methods.encryptSensitiveData = function (data) {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY not configured');
    }

    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
};

/**
 * Decrypt sensitive data
 * @param {Object} encryptedData - Encrypted data object
 * @returns {Object} Decrypted data
 */
userProfileSchema.methods.decryptSensitiveData = function (encryptedData) {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY not configured');
    }

    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv(
        algorithm,
        key,
        Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
};

/**
 * Update profile touch timestamp
 */
userProfileSchema.methods.touch = function () {
    this.updatedAt = new Date();
    return this.save();
};

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;
