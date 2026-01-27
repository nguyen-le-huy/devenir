import User from '../../models/UserModel.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { sendResetEmail } from '../../utils/emailService.js';

// Initialize Google Client
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Helper: Generate JWT Token
 */
export const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

class AuthService {
    /**
     * Register Logic
     */
    async register({ username, email, phone, password, clientUrl }) {
        // 1. Check existing
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) throw new Error('Email already in use');

        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) throw new Error('Username already in use');

        // 2. Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

        // 3. Create User
        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            phone,
            password,
            role: 'user',
            isEmailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });

        // 4. Send Email
        const verificationUrl = `${clientUrl}/verify-email/${verificationToken}`;
        await sendResetEmail({
            email: user.email,
            subject: 'Verify your email - Devenir',
            message: `Please click the link below to verify your email:\n\n${verificationUrl}\n\nThis link expires in 24 hours.`
        });

        return user;
    }

    /**
     * Login Logic
     */
    async login({ email, password }) {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) throw new Error('Invalid email or password');

        // Lock check
        if (user.isLocked()) {
            const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
            throw new Error(`Account is locked. Try again in ${lockTimeRemaining} minutes.`);
        }

        // Password check
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            const isNowLocked = await user.incLoginAttempts();
            if (isNowLocked) {
                throw new Error('Account locked due to too many failed login attempts.');
            }
            const attempts = 5 - user.loginAttempts;
            throw new Error(`Invalid password! ${attempts} attempts remaining.`);
        }

        await user.resetLoginAttempts();

        // Verify check
        if (!user.isEmailVerified) {
            throw new Error('Please verify your email first.');
        }

        return {
            user,
            token: generateToken(user._id, user.role)
        };
    }

    /**
     * Google Login Logic
     */
    async googleLogin({ credential }) {
        // 1. Verify Google Token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, sub: googleId } = payload;

        // 2. Check User by Google ID
        let user = await User.findOne({ googleId });
        if (user) {
            return {
                user,
                token: generateToken(user._id, user.role)
            };
        }

        // 3. Check User by Email (link account)
        user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            user.googleId = googleId;
            user.isEmailVerified = true;
            user.emailVerificationToken = null;
            user.emailVerificationExpires = null;
            await user.save();
            return {
                user,
                token: generateToken(user._id, user.role)
            };
        }

        // 4. Create New User
        // Unique username generator
        let username = email.split('@')[0].toLowerCase();
        let counter = 1;
        while (await User.findOne({ username })) {
            username = `${email.split('@')[0].toLowerCase()}${counter}`;
            counter++;
        }

        user = await User.create({
            username,
            email: email.toLowerCase(),
            googleId,
            role: 'user',
            isEmailVerified: true
        });

        return {
            user,
            token: generateToken(user._id, user.role)
        };
    }

    /**
     * Forgot Password Logic
     */
    async forgotPassword({ email, clientUrl }) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return; // Silent fail

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
        await user.save();

        const resetLink = `${clientUrl}/reset-password/${resetToken}`;
        await sendResetEmail({
            email: user.email,
            subject: 'Devenir - Reset Your Password',
            message: `Click here to reset: ${resetLink} \nLink expires in 1 hour.`
        });
    }

    /**
     * Reset Password Logic
     */
    async resetPassword({ token, newPassword }) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) throw new Error('Invalid or expired token');

        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
    }

    /**
     * Verify Email Logic
     */
    async verifyEmail(token) {
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) throw new Error('Invalid or expired token');

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();
        return user;
    }

    /**
     * Add Phone Logic
     */
    async addPhone({ phone, googleToken }) {
        const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { sub: googleId } = ticket.getPayload();

        const user = await User.findOne({ googleId });
        if (!user) throw new Error('User not found');

        user.phone = phone;
        await user.save();

        return {
            user,
            token: generateToken(user._id, user.role)
        };
    }

    /**
     * Update Profile Logic
     */
    async updateProfile(userId, { username, phone, firstName, lastName, birthday }) {
        // Unique username check
        if (username) {
            const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: userId } });
            if (existing) throw new Error('Username already in use');
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    username: username || undefined,
                    phone: phone || undefined,
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    birthday: birthday || undefined,
                }
            },
            { new: true, runValidators: true }
        );

        if (!user) throw new Error('User not found');
        return user;
    }

    /**
     * Change Password Logic
     */
    async changePassword(userId, { currentPassword, newPassword }) {
        const user = await User.findById(userId).select('+password');
        if (!user) throw new Error('User not found');

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) throw new Error('Incorrect current password');

        user.password = newPassword;
        await user.save();
    }

    /**
     * Update Preferences
     */
    async updatePreferences(userId, { channels, interests }) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        if (!user.preferences) user.preferences = {};

        if (channels) {
            user.preferences.channels = { ...user.preferences.channels, ...channels };
        }
        if (interests) {
            user.preferences.interests = interests;
        }

        await user.save();
        return user;
    }

    /**
     * Get Shipping Address
     */
    async getShippingAddress(userId) {
        const user = await User.findById(userId).lean();
        if (!user) throw new Error('User not found');

        const defaultAddress = user.addresses?.find(addr => addr.isDefault) || user.addresses?.[0] || null;
        return defaultAddress;
    }

    /**
     * Save Shipping Address
     */
    async saveShippingAddress(userId, { firstName, lastName, phoneNumber, address, city, district, zipCode }) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const newAddress = {
            fullName: `${firstName} ${lastName}`,
            phone: phoneNumber,
            street: address,
            city,
            district,
            postalCode: zipCode,
            isDefault: !user.addresses || user.addresses.length === 0
        };

        // Reset other defaults
        if (user.addresses && user.addresses.length > 0) {
            user.addresses.forEach(addr => { addr.isDefault = false; });
            newAddress.isDefault = true;
        }

        user.addresses = user.addresses || [];
        user.addresses.push(newAddress);
        await user.save();

        return newAddress;
    }

    /**
     * Update Shipping Address
     */
    async updateShippingAddress(userId, { firstName, lastName, phoneNumber, address, city, district, zipCode }) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const updatedAddress = {
            fullName: `${firstName} ${lastName}`,
            phone: phoneNumber,
            street: address,
            city,
            district,
            postalCode: zipCode,
            isDefault: true
        };

        if (!user.addresses || user.addresses.length === 0) {
            user.addresses = [updatedAddress];
        } else {
            const defaultIdx = user.addresses.findIndex(addr => addr.isDefault);
            const targetIdx = defaultIdx !== -1 ? defaultIdx : 0;
            user.addresses[targetIdx] = updatedAddress;
        }

        await user.save();
        return updatedAddress;
    }
}

export default new AuthService();
