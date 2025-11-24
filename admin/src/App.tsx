import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import ProductsPage from './pages/products/ProductsPage'
import EditProductPage from './pages/products/EditProductPage'
import VariantsPage from './pages/products/VariantsPage'
import OrdersPage from './pages/orders/OrdersPage'
import CustomersPage from './pages/customers/CustomersPage'
import InventoryPage from './pages/inventory/InventoryPage'
import PromotionsPage from './pages/marketing/PromotionsPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import SettingsPage from './pages/settings/SettingsPage'
import ChatbotPage from './pages/chatbot/ChatbotPage'

function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
        {/* Auth Routes */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Products */}
        <Route path="/admin/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/admin/products/new" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/admin/products/edit/:id" element={<ProtectedRoute><EditProductPage /></ProtectedRoute>} />
        <Route path="/admin/products/:id" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/admin/variants" element={<ProtectedRoute><VariantsPage /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/admin/brands" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />

        {/* Orders */}
        <Route path="/admin/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/admin/orders/:id" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/admin/shipments" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/admin/returns" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />

        {/* Customers */}
        <Route path="/admin/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/admin/customers/:id" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/admin/customer-groups" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />

        {/* Inventory */}
        <Route path="/admin/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
        <Route path="/admin/inventory/alerts" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />

        {/* Marketing */}
        <Route path="/admin/promotions" element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />
        <Route path="/admin/promotions/new" element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />
        <Route path="/admin/campaigns" element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />
        <Route path="/admin/loyalty" element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />

        {/* Analytics */}
        <Route path="/admin/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/reports/revenue" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

        {/* Settings */}
        <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/general" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/payment" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings/email" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* AI Chatbot */}
        <Route path="/admin/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  )
}

export default App
