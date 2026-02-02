import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
    useLogin, 
    useRegister, 
    useGoogleAuth, 
    useForgotPassword 
} from './';
import { LoginData, RegisterData, AuthResponse } from '../types';
import { AUTH_MESSAGES, getWelcomeMessage, getWelcomeBackMessage } from '../constants';

interface UseAuthActionsOptions {
    /**
     * Callback executed after successful action (e.g., close modal)
     */
    onSuccess?: () => void;
    
    /**
     * Redirect path after success (default: '/')
     */
    redirectTo?: string;
}

/**
 * useAuthActions - Reusable auth handlers for AuthPage & AuthModal
 * Eliminates code duplication between page and modal versions
 * 
 * Provides consistent handlers for:
 * - Login (traditional + Google)
 * - Registration
 * - Forgot password
 * 
 * @param options - Configuration options
 * @param options.onSuccess - Callback after successful auth (e.g., close modal)
 * @param options.redirectTo - Path to navigate to after success (default: '/')
 * 
 * @returns Object with auth handlers and mutation states
 * 
 * @example
 * ```tsx
 * // Usage in AuthPage
 * const { handleLogin, handleGoogleLogin, isLoading } = useAuthActions();
 * 
 * // Usage in AuthModal (with modal close callback)
 * const { handleLogin, isLoading } = useAuthActions({ 
 *     onSuccess: onClose 
 * });
 * ```
 */
export const useAuthActions = (options: UseAuthActionsOptions = {}) => {
    const navigate = useNavigate();
    const { onSuccess, redirectTo = '/' } = options;
    
    // Mutations
    const loginMutation = useLogin();
    const registerMutation = useRegister();
    const googleAuthMutation = useGoogleAuth();
    const forgotPasswordMutation = useForgotPassword();
    
    // ========== LOGIN ==========
    /**
     * Handle traditional email/password login
     */
    const handleLogin = (data: LoginData) => {
        loginMutation.mutate(data, {
            onSuccess: () => {
                toast.success(AUTH_MESSAGES.LOGIN_SUCCESS);
                onSuccess?.();
                navigate(redirectTo);
            },
            onError: (error) => {
                toast.error(error.message || AUTH_MESSAGES.LOGIN_FAILED);
            }
        });
    };
    
    // ========== GOOGLE LOGIN ==========
    /**
     * Handle Google OAuth login
     */
    const handleGoogleLogin = (credential: string | undefined) => {
        if (!credential) return;
        
        googleAuthMutation.mutate(credential, {
            onSuccess: (response: AuthResponse) => {
                toast.success(getWelcomeBackMessage(response.user.firstName));
                onSuccess?.();
                navigate(redirectTo);
            },
            onError: (error) => {
                toast.error(error.message || AUTH_MESSAGES.GOOGLE_LOGIN_FAILED);
            }
        });
    };
    
    // ========== REGISTER ==========
    /**
     * Handle user registration
     * Supports both immediate login and email verification flows
     */
    const handleRegister = (data: RegisterData, shouldNavigate = true) => {
        registerMutation.mutate(data, {
            onSuccess: (response: AuthResponse) => {
                if (response.token && response.user) {
                    // Immediate login (no email verification required)
                    toast.success(getWelcomeMessage(response.user.firstName));
                    onSuccess?.();
                    if (shouldNavigate) {
                        navigate(redirectTo);
                    }
                } else {
                    // Email verification required
                    toast.success(AUTH_MESSAGES.REGISTER_SUCCESS);
                    onSuccess?.();
                }
            }
            // Error toast already shown by useRegister hook
        });
    };
    
    // ========== GOOGLE REGISTER ==========
    /**
     * Handle Google OAuth registration
     */
    const handleGoogleRegister = (credential: string | undefined) => {
        if (!credential) return;
        
        googleAuthMutation.mutate(credential, {
            onSuccess: (response: AuthResponse) => {
                if (response.user && response.token) {
                    toast.success(getWelcomeMessage(response.user.firstName));
                    onSuccess?.();
                    navigate(redirectTo);
                }
            },
            onError: (error) => {
                toast.error(error.message || AUTH_MESSAGES.GOOGLE_REGISTER_FAILED);
            }
        });
    };
    
    // ========== FORGOT PASSWORD ==========
    /**
     * Handle forgot password request
     */
    const handleForgotPassword = (data: { email: string }) => {
        forgotPasswordMutation.mutate(data, {
            onSuccess: () => {
                onSuccess?.();
                // Success toast already shown by useForgotPassword hook
            }
        });
    };
    
    // ========== RETURN API ==========
    return {
        // Handlers
        handleLogin,
        handleGoogleLogin,
        handleRegister,
        handleGoogleRegister,
        handleForgotPassword,
        
        // Mutation states for UI
        isLoading: 
            loginMutation.isPending || 
            registerMutation.isPending || 
            googleAuthMutation.isPending || 
            forgotPasswordMutation.isPending,
            
        // Individual errors for granular error handling
        loginError: loginMutation.error,
        registerError: registerMutation.error,
        googleError: googleAuthMutation.error,
        forgotPasswordError: forgotPasswordMutation.error,
        
        // Individual loading states (if needed)
        isLoginLoading: loginMutation.isPending,
        isRegisterLoading: registerMutation.isPending,
        isGoogleLoading: googleAuthMutation.isPending,
        isForgotPasswordLoading: forgotPasswordMutation.isPending,
    };
};
