import './global.css'
import HomePage from './pages/HomePage/HomePage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import EmailVerificationPage from './pages/auth/EmailVerificationPage'
import RegisterPage from './pages/RegisterPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AuthPage from './pages/auth/AuthPage'
import Layout from './components/layout/Layout.jsx'
import Lenis from 'lenis';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import ProductByCategory from './pages/ProductByCategory/ProductByCategory.jsx';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

gsap.registerPlugin(ScrollTrigger);

export let lenisInstance

function App() {
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

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Route - with Layout (Header & Footer) */}
          <Route path="/auth" element={<Layout><AuthPage /></Layout>} />
          {/* Email Verification Route */}
          <Route path="/verify-email/:token" element={<Layout><EmailVerificationPage /></Layout>} />
          {/* Reset Password Route */}
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Registration Route */}
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Public Routes - HomePage không cần login */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/scarves" element={<Layout><ProductByCategory /></Layout>} />
          
          {/* Redirect unknown paths to home */}
          <Route path="*" element={<Layout><HomePage /></Layout>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
