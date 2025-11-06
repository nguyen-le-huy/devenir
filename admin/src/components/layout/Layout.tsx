import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Topbar from './Topbar.tsx';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen">
          <Topbar />
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
