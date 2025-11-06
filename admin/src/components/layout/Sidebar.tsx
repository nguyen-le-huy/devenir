import { NavLink } from 'react-router-dom';

const linkClass = 'block rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors';
const activeClass = 'bg-gray-200 text-gray-900';

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Devenir Admin</h1>
      </div>
      <nav className="space-y-1">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}
        >
          📊 Dashboard
        </NavLink>
        <NavLink 
          to="/products" 
          className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}
        >
          🛍️ Products
        </NavLink>
        <NavLink 
          to="/orders" 
          className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}
        >
          📦 Orders
        </NavLink>
        <NavLink 
          to="/customers" 
          className={({ isActive }) => `${linkClass} ${isActive ? activeClass : ''}`}
        >
          👥 Customers
        </NavLink>
      </nav>
    </aside>
  );
}
