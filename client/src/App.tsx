import './global.css'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'sonner';
import { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

// @ts-ignore
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
import Loading from '@/shared/components/Loading/Loading';
import Preloader from '@/shared/components/Preloader/Preloader';
import { useTracking } from '@/core/hooks/useTracking';
import { trackingService } from '@/core/services/trackingService';
import useLenis from '@/shared/hooks/useLenis';

const Layout = lazy(() => import('@/shared/components/layout/Layout'));
const HomePage = lazy(() => import('@/features/home/pages/HomePage/HomePage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/Register/RegisterPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/auth/ResetPasswordPage'));
const AuthPage = lazy(() => import('@/features/auth/pages/auth/AuthPage'));
const EmailVerificationPage = lazy(() => import('@/features/auth/pages/auth/EmailVerificationPage'));
const UserProfile = lazy(() => import('@/features/user/pages/UserProfile/UserProfile'));
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
                <Toaster position="top-center" richColors />

                {/* ✅ Preloader hiển thị ngay lập tức - TRƯỚC Suspense */}
                <HomePreloader />

                <ErrorBoundary>
                    <Suspense fallback={<Loading />}>
                        <Routes>
                            {/* ✅ Routes KHÔNG cần Layout */}
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                            <Route path="/categories" element={<AllCategories />} />

                            {/* ✅ Routes CẦN Layout - bọc trong Layout element */}
                            <Route element={<Layout />}>
                                <Route path="/auth" element={<AuthPage />} />
                                <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
                                <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                                <Route path="/" element={<HomePage />} />
                                <Route path="/products" element={<ProductByCategory />} />
                                <Route path="/product-detail" element={<ProductDetail />} />
                                <Route path="*" element={<HomePage />} />
                                <Route path="/visually-similar" element={<VisuallySimilar />} />
                            </Route>

                            <Route element={<CheckoutLayout />}>
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/shipping" element={<Shipping />} />
                                <Route
                                    path="/checkout/payos/success"
                                    element={
                                        <ProtectedRoute>
                                            <PayOSResult />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/payment-successful"
                                    element={
                                        <PaymentSuccessful />
                                    }
                                />
                                <Route
                                    path="/payment-failed"
                                    element={
                                        <PaymentFailed />
                                    }
                                />
                                <Route
                                    path="/checkout/nowpayments/success"
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

// Component để auto-track page views
function TrackingWrapper() {
    useTracking(); // Auto track page views on route change
    return null;
}

// ✅ Component render Preloader chỉ khi ở trang chủ
function HomePreloader() {
    const location = useLocation();

    // Chỉ hiển thị Preloader trên trang chủ
    if (location.pathname !== '/') {
        return null;
    }

    return <Preloader />;
}

export default App;
