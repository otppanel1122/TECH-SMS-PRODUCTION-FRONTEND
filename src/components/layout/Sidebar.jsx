import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Phone,
  Users,
  FileText,
  Shield,
  ChevronDown,
  ChevronRight,
  LogOut,
  Clock,
  User,
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const Sidebar = ({ activeView, setActiveView }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [expandedMenus, setExpandedMenus] = useState({ users: false });
  const userRole = user?.user_metadata?.role || 'user';

  useEffect(() => {
    const interval = setInterval(() => {}, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-numbers', label: 'My Numbers', icon: Phone },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      subItems: [{ id: 'clients', label: 'Clients' }],
      expanded: expandedMenus.users,
      onToggle: () => toggleMenu('users'),
    },
    { id: 'cdr', label: 'CDR & Statistics', icon: FileText },
  ];

  // Admin/Agent only
  if (userRole === 'admin' || userRole === 'agent') {
    navItems.splice(3, 0, { id: 'admin', label: 'Admin Panel', icon: Shield });
  }

  const renderNavItem = (item) => {
    if (item.subItems) {
      const isActive = activeView === item.id || item.subItems.some(s => activeView === s.id);
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => { item.onToggle(); }}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 ${
              isActive ? 'bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {item.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {item.expanded && (
            <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-4">
              {item.subItems.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveView(sub.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                    activeView === sub.id
                      ? 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-600/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <button
        key={item.id}
        onClick={() => setActiveView(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 ${
          activeView === item.id ? 'bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <item.icon className="w-5 h-5" />
        <span className="text-sm font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="h-full flex flex-col bg-white dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800/50">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <div className="text-slate-900 dark:text-white font-bold text-lg">SMS Panel</div>
            <div className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>Welcome,</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.email?.split('@')[0] || 'User'}</span>
          <span className="bg-brand-100 dark:bg-brand-600/20 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded-full text-[10px] font-medium">
            {userRole}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800/50 flex-shrink-0">
        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
