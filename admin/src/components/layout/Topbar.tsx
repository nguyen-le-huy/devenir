export default function Topbar() {
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };

  return (
    <header className="h-14 border-b bg-white px-4 flex items-center justify-between">
      <span className="font-medium text-gray-700">Admin Dashboard</span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleLogout}
          className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm hover:bg-gray-800 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
