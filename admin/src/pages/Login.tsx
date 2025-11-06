import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: Tích hợp với API thật
    // const res = await api.post('/auth/login', { email, password });
    // if (res.data.user.role !== 'admin') { throw Error }
    // localStorage.setItem('admin_token', res.data.token);
    
    // Development only - remove in production
    if (email === 'admin@devenir.com' && password === 'admin123') {
      localStorage.setItem('admin_token', 'dev-token-admin');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form 
        onSubmit={handleSubmit} 
        className="w-full max-w-sm rounded-lg border bg-white p-6 space-y-4 shadow-sm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">Devenir Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@devenir.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full rounded-md bg-gray-900 text-white px-3 py-2 hover:bg-gray-800 transition-colors"
        >
          Sign in
        </button>

        <p className="text-xs text-gray-500 text-center">
          Dev: admin@devenir.com / admin123
        </p>
      </form>
    </div>
  );
}
