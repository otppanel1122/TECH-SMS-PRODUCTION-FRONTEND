import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RefreshCw, ChevronLeft, ChevronRight, Users, Shield, UserPlus, Ban, Check, Trash2, Eye } from 'lucide-react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.user_metadata?.role || 'user';
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'user' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers(1, 100);
      if (response.data.success) {
        const usersData = response.data.data.users || [];
        setUsers(usersData);
        setFilteredUsers(usersData);
      } else {
        setError(response.data.error || 'Failed to load users');
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredUsers(users.filter(u => 
      u.email?.toLowerCase().includes(term) ||
      u.user_metadata?.full_name?.toLowerCase().includes(term)
    ));
    setCurrentPage(1);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.changeRole(userId, newRole);
      showToast('Role updated', 'success');
      loadUsers();
    } catch (error) {
      showToast('Failed to update role', 'error');
    }
  };

  const handleBan = async (userId) => {
    if (!confirm('Ban this user?')) return;
    try {
      await adminAPI.banUser(userId);
      showToast('User banned', 'success');
      loadUsers();
    } catch (error) {
      showToast('Failed to ban', 'error');
    }
  };

  const handleUnban = async (userId) => {
    try {
      await adminAPI.unbanUser(userId);
      showToast('User unbanned', 'success');
      loadUsers();
    } catch (error) {
      showToast('Failed to unban', 'error');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await adminAPI.deleteUser(userId);
      showToast('User deleted', 'success');
      loadUsers();
    } catch (error) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(newUser);
      showToast('User created', 'success');
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'user' });
      loadUsers();
    } catch (error) {
      showToast('Failed to create user', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg ${type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400'} backdrop-blur-sm max-w-md shadow-lg animate-slide-up`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; setTimeout(() => toast.remove(), 300); }, 3000);
  };

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + perPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    if (end - start < maxVisible - 1) {
      if (start === 1) end = Math.min(totalPages, start + maxVisible - 1);
      else if (end === totalPages) start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  if (userRole !== 'admin' && userRole !== 'agent') {
    return <div className="glass-card p-8 text-center text-rose-600 dark:text-rose-400">You do not have permission to access this page.</div>;
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="glass-card p-8 text-center text-rose-600 dark:text-rose-400">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="glass-card px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">User Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total: {users.length} users</p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Create User
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 sm:w-64">
          <input type="text" value={searchTerm} onChange={handleSearch} className="input-field pl-4 text-sm" placeholder="Search users..." />
        </div>
        <button onClick={loadUsers} className="btn-secondary text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <div className="table-container overflow-x-auto">
        <div className="min-w-[600px]">
          <table>
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? paginatedUsers.map((u) => {
                const metadata = u.user_metadata || {};
                const role = metadata.role || 'user';
                const isBanned = u.banned || false;
                const isCurrentUser = u.id === user?.id;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">{u.email?.charAt(0).toUpperCase() || 'U'}</span>
                        </div>
                        <div><div className="font-medium text-slate-900 dark:text-white text-sm">{metadata.full_name || 'User'}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      {userRole === 'admin' ? (
                        <select value={role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="select-field w-24 text-xs py-1">
                          <option value="admin">Admin</option>
                          <option value="agent">Agent</option>
                          <option value="user">User</option>
                        </select>
                      ) : (
                        <span className={`badge-${role === 'admin' ? 'danger' : role === 'agent' ? 'warning' : 'info'}`}>{role}</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><span className={`badge-${isBanned ? 'danger' : 'success'}`}>{isBanned ? 'Banned' : 'Active'}</span></td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!isBanned && userRole === 'admin' && !isCurrentUser && (
                          <button onClick={() => handleBan(u.id)} className="p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-500/10"><Ban className="w-4 h-4 text-amber-600 dark:text-amber-400" /></button>
                        )}
                        {isBanned && userRole === 'admin' && !isCurrentUser && (
                          <button onClick={() => handleUnban(u.id)} className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></button>
                        )}
                        {userRole === 'admin' && !isCurrentUser && (
                          <button onClick={() => handleDelete(u.id)} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Showing {startIndex + 1} to {Math.min(startIndex + perPage, filteredUsers.length)} of {filteredUsers.length}</div>
          <div className="flex flex-wrap items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50">First</button>
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            {getPageNumbers().map(page => <button key={page} onClick={() => setCurrentPage(page)} className={`px-2 py-1 rounded-lg text-xs font-medium ${currentPage === page ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>{page}</button>)}
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50">Last</button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label><input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password *</label><input type="password" required minLength="6" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label><input type="text" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label><select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="select-field"><option value="user">User</option><option value="agent">Agent</option><option value="admin">Admin</option></select></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
