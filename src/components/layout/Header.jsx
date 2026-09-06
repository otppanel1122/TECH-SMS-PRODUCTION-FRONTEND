import React from 'react';
import { useSelector } from 'react-redux';
import { Sun, Moon, Bell, Search } from 'lucide-react';

const Header = ({ activeView }) => {
  const { user } = useSelector((state) => state.auth);
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  };

  React.useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const getViewTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      'my-numbers': 'My Numbers',
      clients: 'Clients',
      cdr: 'CDR & Statistics',
      admin: 'Admin Panel',
    };
    return titles[activeView] || 'Dashboard';
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{getViewTitle()}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
          {theme === 'dark' ? <Sun className="w-5 h-5 text-slate-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800/50">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm text-slate-900 dark:text-white font-medium">{user?.email?.split('@')[0] || 'User'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{user?.user_metadata?.role || 'User'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
