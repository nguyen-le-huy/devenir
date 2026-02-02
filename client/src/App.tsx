import './global.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'sonner';
import { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

import ScrollToTop from '@/shared/components/ScrollToTop/ScrollToTop';
import ChatIcon from '@/features/chat/components/ChatIcon';
import ChatWindow from '@/features/chat/components/ChatWindow';
import PayOSResult from '@/features/checkout/pages/PayOS/PayOSResult';
import NowPaymentsResult from '@/features/checkout/pages/NowPayments/NowPaymentsResult';
import PaymentSuccessful from '@/features/checkout/pages/PaymentStatus/PaymentSuccessful';
import PaymentFailed from '@/features/checkout/pages/PaymentStatus/PaymentFailed';
import VisuallySimilar from '@/features/products/pages/VisuallySimilar/VisuallySimilar';

import AllCategories from '@/features/products/pages/AllCategories/AllCategories';
import ErrorBoundary from '@/shared/components/ErrorBoundary/ErrorBoundary';
import ErrorBoundaryWrapper from '@/shared/components/ErrorBoundary/ErrorBoundaryWrapper';
import Loading from '@/shared/components/Loading/Loading';
import HomePreloader from '@/shared/components/Preloader/HomePreloader';
import TrackingWrapper from '@/core/components/TrackingWrapper';
import { trackingService } from '@/core/services/trackingService';
import useLenis from '@/shared/hooks/useLenis';
import { ROUTES } from '@/core/constants/routes';

const Layout = lazy(() => import('@/shared/components/layout/Layout'));
const HomePage = lazy(() => import('@/features/home/pages/HomePage/HomePage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/Register/RegisterPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/auth/ResetPasswordPage'));
const AuthPage = lazy(() => import('@/features/auth/pages/auth/AuthPage'));
const EmailVerificationPage = lazy(() => import('@/features/auth/pages/auth/EmailVerificationPage'));
const UserProfile = lazy(() => import('@/features/user/pages/UserProfile'));
const ProductByCategory = lazy(() => import('@/features/products/pages/ProductByCategory/ProductByCategory'));
const ProductDetail = lazy(() => import('@/features/products/pages/ProductDetail/ProductDetail'));
const CheckoutLayout = lazy(() => import('@/features/checkout/components/checkoutLayout/CheckoutLayout'));
const Checkout = lazy(() => import('@/features/checkout/pages/Checkout/Checkout'));
const Shipping = lazy(() => import('@/features/checkout/pages/Checkout/Shipping'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Memoize chat handlers to prevent unnecessary re-renders
    const handleOpenChat = useCallback(() => setIsChatOpen(true), []);
    const handleCloseChat = useCallback(() => setIsChatOpen(false), []);

    // Initialize Lenis smooth scroll
    useLenis();

    // Initialize tracking service on app mount
    useEffect(() => {
        const userId = localStorage.getItem('userId') || undefined;
        trackingService.init(userId);

        // Update user ID when user logs in
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'userId' && e.newValue) {
                trackingService.setUserId(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Validate Google Client ID
    if (!GOOGLE_CLIENT_ID) {
        // console.warn('⚠️ VITE_GOOGLE_CLIENT_ID is not set in environment variables');
    }

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <BrowserRouter>
                <ScrollToTop />
                <TrackingWrapper />
                <Toaster position="top-center" richColors duration={2000} />

                {/* Preloader: Rendered immediately before Suspense boundary */}
                <HomePreloader />

                <ErrorBoundary>
                    <Suspense fallback={<Loading />}>
                        <Routes>
                            {/* Standalone Routes: No main layout wrapper */}
                            <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
                            <Route
                                path={ROUTES.AUTH.RESET_PASSWORD}
                                element={
                                    <ErrorBoundaryWrapper>
                                        <ResetPasswordPage />
                                    </ErrorBoundaryWrapper>
                                }
                            />
                            <Route path={ROUTES.PRODUCTS.CATEGORIES} element={<AllCategories />} />

                            {/* Main App Routes: Wrapped with default Layout */}
                            <Route element={<Layout />}>
                                <Route path={ROUTES.AUTH.LOGIN} element={<AuthPage />} />
                                <Route
                                    path={ROUTES.AUTH.VERIFY_EMAIL}
                                    element={
                                        <ErrorBoundaryWrapper>
                                            <EmailVerificationPage />
                                        </ErrorBoundaryWrapper>
                                    }
                                />
                                <Route path={ROUTES.USER.PROFILE} element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                                <Route path={ROUTES.HOME} element={<HomePage />} />
                                <Route path={ROUTES.PRODUCTS.LIST} element={<ProductByCategory />} />
                                <Route path={ROUTES.PRODUCTS.DETAIL} element={<ProductDetail />} />
                                <Route path="*" element={<HomePage />} />
                                <Route path={ROUTES.PRODUCTS.VISUALLY_SIMILAR} element={<VisuallySimilar />} />
                            </Route>

                            <Route element={<CheckoutLayout />}>
                                <Route path={ROUTES.CHECKOUT.MAIN} element={<Checkout />} />
                                <Route path={ROUTES.CHECKOUT.SHIPPING} element={<Shipping />} />
                                <Route
                                    path={ROUTES.CHECKOUT.PAYOS_SUCCESS}
                                    element={
                                        <ProtectedRoute>
                                            <PayOSResult />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path={ROUTES.CHECKOUT.SUCCESS}
                                    element={
                                        <PaymentSuccessful />
                                    }
                                />
                                <Route
                                    path={ROUTES.CHECKOUT.FAILED}
                                    element={
                                        <PaymentFailed />
                                    }
                                />
                                <Route
                                    path={ROUTES.CHECKOUT.NOWPAYMENTS_SUCCESS}
                                    element={
                                        <ProtectedRoute>
                                            <NowPaymentsResult />
                                        </ProtectedRoute>
                                    }
                                />
                            </Route>
                        </Routes>
                    </Suspense>
                </ErrorBoundary>

                <ChatIcon onClick={handleOpenChat} />
                {isChatOpen && <ChatWindow onClose={handleCloseChat} />}
            </BrowserRouter>
        </GoogleOAuthProvider>
    );
}

export default App;
