
export interface User {
    _id: string;
    email: string;
    role: 'user' | 'admin';
    username: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthday?: string;
    avatar?: string;
    preferences?: UserPreferences;
    createdAt?: string;
    updatedAt?: string;
    emailVerified?: boolean;
}

export interface UserPreferences {
    channels: {
        email: boolean;
        phone: boolean;
        messaging: boolean;
        post: boolean;
    };
    interests: 'menswear' | 'womenswear' | 'both';
}

export interface RegisterData {
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
}

export interface LoginData {
    email?: string;
    password?: string;
}

export interface UserProfileData {
    username?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    birthday?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface ResetPasswordData {
    newPassword: string;
}

export interface ChangePasswordData {
    currentPassword?: string;
    newPassword: string;
    confirmPassword?: string;
}

export interface PhoneVerificationData {
    phone: string;
    googleToken: string | null;
}
