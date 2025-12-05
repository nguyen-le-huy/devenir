import './global.css'
import HomePage from './pages/HomePage/HomePage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import EmailVerificationPage from './pages/auth/EmailVerificationPage'
import RegisterPage from './pages/RegisterPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/auth/AuthPage'
import Layout from './components/layout/Layout.jsx'
import CheckoutLayout from './components/checkoutLayout/CheckoutLayout.jsx'
import UserProfile from './pages/UserProfile/UserProfile.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Lenis from 'lenis';
import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import ProductByCategory from './pages/ProductByCategory/ProductByCategory.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import ProductDetail from './pages/ProductDetail/ProductDetail.jsx';
import Checkout from './pages/Checkout/Checkout';
import ScrollToTop from './components/ScrollToTop/ScrollToTop.jsx';
import Shipping from './pages/Checkout/Shipping.jsx';
import ChatIcon from './components/Chat/ChatIcon';
import ChatWindow from './components/Chat/ChatWindow';
import PayOSResult from './pages/PayOS/PayOSResult.jsx';
import NowPaymentsResult from './pages/NowPayments/NowPaymentsResult.jsx';
import PaymentSuccessful from './pages/PaymentStatus/PaymentSuccessful.jsx';
import PaymentFailed from './pages/PaymentStatus/PaymentFailed.jsx';

gsap.registerPlugin(ScrollTrigger);

export let lenisInstance

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = () => setIsChatOpen(true);
  const handleCloseChat = () => setIsChatOpen(false);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisInstance = lenis;

    // Đồng bộ Lenis với GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)

    // Cleanup
    return () => {
      lenisInstance = null
      lenis.destroy()
      gsap.ticker.remove()
    }
  }, []);

  // Validate Google Client ID
  if (!GOOGLE_CLIENT_ID) {
    console.error('⚠️ VITE_GOOGLE_CLIENT_ID is not set in environment variables');
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            {/* ✅ Routes KHÔNG cần Layout */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* ✅ Routes CẦN Layout - bọc trong Layout element */}
            <Route element={<Layout />}>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductByCategory />} />
              <Route path="/product-detail" element={<ProductDetail />} />
              <Route path="*" element={<HomePage />} />
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
          <ChatIcon onClick={handleOpenChat} />
          {isChatOpen && <ChatWindow onClose={handleCloseChat} />}
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
