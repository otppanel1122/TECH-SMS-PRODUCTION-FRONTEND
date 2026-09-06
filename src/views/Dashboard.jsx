import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Phone, Users, Tag, DollarSign, TrendingUp, Calendar, Clock, BarChart3 } from 'lucide-react';
import { dashboardAPI, numbersAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalNumbers: 0,
    totalUsers: 0,
    totalRanges: 0,
    todaySms: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, numbersRes] = await Promise.all([
        dashboardAPI.getStats(),
        numbersAPI.getMyNumbers(),
      ]);
      const statsData = statsRes.data?.data || {};
      const numbersData = numbersRes.data?.data?.numbers || [];
      
      const ranges = new Set();
      numbersData.forEach(num => {
        if (num.range_name) ranges.add(num.range_name);
      });

      setStats({
        totalNumbers: statsData.total_numbers || numbersData.length,
        totalUsers: statsData.total_users || 0,
        totalRanges: ranges.size || 0,
        todaySms: statsData.today_sms || 0,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      setStats(prev => ({ ...prev, loading: false, error: 'Failed to load dashboard' }));
    }
  };

  if (stats.loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  if (stats.error) {
    return <div className="glass-card p-8 text-center text-rose-600 dark:text-rose-400">{stats.error}</div>;
  }

  const cards = [
    { title: 'Total Numbers', value: stats.totalNumbers, icon: Phone, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-100 dark:bg-brand-500/10' },
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/10' },
    { title: 'Total Ranges', value: stats.totalRanges, icon: Tag, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/10' },
    { title: "Today's SMS", value: stats.todaySms, icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Welcome back, {user?.email?.split('@')[0] || 'User'}!
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here's an overview of your SMS operations
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="metric-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
        <p className="text-slate-500 dark:text-slate-400">No recent activity to display.</p>
      </div>
    </div>
  );
};

export default Dashboard;
