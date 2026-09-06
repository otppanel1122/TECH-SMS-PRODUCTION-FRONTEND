import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Menu } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './views/Dashboard';
import MyNumbers from './views/MyNumbers';
import Clients from './views/Clients';
import CDR from './views/CDR';
import AdminPanel from './views/AdminPanel';
import { setUser, setToken } from './store/slices/authSlice';
import { authAPI } from './services/api';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      dispatch(setToken(token));
      dispatch(setUser(JSON.parse(user)));
    }
  }, [dispatch]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeView]);

  if (!isAuthenticated) return <LoginPage />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'my-numbers': return <MyNumbers />;
      case 'clients': return <Clients />;
      case 'cdr': return <CDR />;
      case 'admin': return <AdminPanel />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800/50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-14 sm:h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 lg:hidden">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50">
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{activeView.replace('-', ' ')}</h1>
          <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.email?.charAt(0).toUpperCase() || 'U' : 'U'}
            </span>
          </div>
        </header>
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800/50 items-center justify-between px-6 flex-shrink-0 hidden lg:flex">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white capitalize">{activeView.replace('-', ' ')}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.email?.charAt(0).toUpperCase() || 'U' : 'U'}
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm text-slate-900 dark:text-white font-medium">
                  {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.email?.split('@')[0] || 'User' : 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.user_metadata?.role || 'User' : 'User'}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(email, password);
      if (response.data.success) {
        dispatch(setUser(response.data.user));
        dispatch(setToken(response.data.access_token));
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.reload();
      } else {
        setError(response.data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-card p-6 sm:p-8 max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">SMS Operator Panel</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">Sign in to access the dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="operator@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}

export default App;
