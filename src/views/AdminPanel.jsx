import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  RefreshCw, ChevronLeft, ChevronRight, UserPlus, Ban, Check, Trash2, 
  Plus, Phone, Users, X, Upload, Copy, FileText, FileSpreadsheet 
} from 'lucide-react';
import { adminAPI, numbersAPI } from '../services/api';
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
  const [toast, setToast] = useState(null);
  
  // Number Pool State
  const [poolNumbers, setPoolNumbers] = useState([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);
  const [newNumber, setNewNumber] = useState({
    number: '',
    range_name: '',
    rate: 0.01,
    term: '7/1'
  });
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [selectedPoolNumbers, setSelectedPoolNumbers] = useState([]);

  useEffect(() => {
    loadUsers();
    loadPoolNumbers();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ========== USER MANAGEMENT ==========
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getUsers(1, 100);
      if (response.data && response.data.success) {
        const usersData = response.data.data?.users || [];
        setUsers(usersData);
        setFilteredUsers(usersData);
      } else {
        const errorMsg = response.data?.error || 'Failed to load users';
        setError(errorMsg);
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load users';
      setError(errorMsg);
      setUsers([]);
      setFilteredUsers([]);
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
      const response = await adminAPI.changeRole(userId, newRole);
      if (response.data && response.data.success) {
        showToast('Role updated successfully', 'success');
        loadUsers();
      } else {
        showToast(response.data?.error || 'Failed to update role', 'error');
      }
    } catch (error) {
      showToast('Failed to update role', 'error');
    }
  };

  const handleBan = async (userId) => {
    if (!confirm('Ban this user?')) return;
    try {
      const response = await adminAPI.banUser(userId);
      if (response.data && response.data.success) {
        showToast('User banned successfully', 'success');
        loadUsers();
      } else {
        showToast(response.data?.error || 'Failed to ban user', 'error');
      }
    } catch (error) {
      showToast('Failed to ban user', 'error');
    }
  };

  const handleUnban = async (userId) => {
    try {
      const response = await adminAPI.unbanUser(userId);
      if (response.data && response.data.success) {
        showToast('User unbanned successfully', 'success');
        loadUsers();
      } else {
        showToast(response.data?.error || 'Failed to unban user', 'error');
      }
    } catch (error) {
      showToast('Failed to unban user', 'error');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user permanently? This cannot be undone!')) return;
    try {
      const response = await adminAPI.deleteUser(userId);
      if (response.data && response.data.success) {
        showToast('User deleted successfully', 'success');
        loadUsers();
      } else {
        showToast(response.data?.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      showToast('Failed to delete user', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createUser(newUser);
      if (response.data && response.data.success) {
        showToast('User created successfully', 'success');
        setShowCreateModal(false);
        setNewUser({ email: '', password: '', full_name: '', role: 'user' });
        loadUsers();
      } else {
        showToast(response.data?.error || 'Failed to create user', 'error');
      }
    } catch (error) {
      showToast('Failed to create user', 'error');
    }
  };

  // ========== NUMBER POOL MANAGEMENT ==========
  const loadPoolNumbers = async () => {
    setPoolLoading(true);
    try {
      const response = await numbersAPI.getMyNumbers();
      if (response.data && response.data.success) {
        setPoolNumbers(response.data.data?.numbers || []);
      } else {
        setPoolNumbers([]);
      }
    } catch (error) {
      console.error('Error loading pool numbers:', error);
      setPoolNumbers([]);
    } finally {
      setPoolLoading(false);
    }
  };

  const handleAddNumber = async (e) => {
    e.preventDefault();
    try {
      // Call the allocate endpoint to add numbers to pool
      const response = await numbersAPI.allocate({
        numbers: [newNumber.number],
        range_name: newNumber.range_name,
        rate: parseFloat(newNumber.rate),
        term: newNumber.term,
        user_email: user?.email // Add to pool under admin/agent
      });
      
      if (response.data && response.data.success) {
        showToast(`Number ${newNumber.number} added to pool successfully`, 'success');
        setShowAddNumberModal(false);
        setNewNumber({ number: '', range_name: '', rate: 0.01, term: '7/1' });
        loadPoolNumbers();
      } else {
        showToast(response.data?.error || 'Failed to add number', 'error');
      }
    } catch (error) {
      showToast('Failed to add number to pool', 'error');
    }
  };

  const handleBulkAddNumbers = async () => {
    const numbers = bulkNumbers.split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    if (numbers.length === 0) {
      showToast('Please paste at least one number', 'error');
      return;
    }

    try {
      let successCount = 0;
      for (const number of numbers) {
        const response = await numbersAPI.allocate({
          numbers: [number],
          range_name: 'Pool',
          rate: 0.01,
          term: '7/1',
          user_email: user?.email
        });
        if (response.data && response.data.success) {
          successCount++;
        }
      }
      
      showToast(`Added ${successCount} numbers to pool successfully`, 'success');
      setBulkNumbers('');
      loadPoolNumbers();
    } catch (error) {
      showToast('Failed to add numbers to pool', 'error');
    }
  };

  const handleRemoveFromPool = async (numberId) => {
    if (!confirm('Remove this number from pool?')) return;
    try {
      const response = await numbersAPI.deallocate(numberId);
      if (response.data && response.data.success) {
        showToast('Number removed from pool', 'success');
        loadPoolNumbers();
      } else {
        showToast(response.data?.error || 'Failed to remove number', 'error');
      }
    } catch (error) {
      showToast('Failed to remove number', 'error');
    }
  };

  const handleAssignToUser = async (numberId, userEmail) => {
    if (!userEmail) {
      showToast('Please select a user', 'error');
      return;
    }
    try {
      const number = poolNumbers.find(n => n.id === numberId);
      if (!number) {
        showToast('Number not found', 'error');
        return;
      }
      
      const response = await numbersAPI.allocate({
        numbers: [number.number],
        range_name: number.range_name || 'Assigned',
        rate: number.rate || 0.01,
        term: number.term || '7/1',
        user_email: userEmail
      });
      
      if (response.data && response.data.success) {
        showToast(`Number assigned to ${userEmail}`, 'success');
        loadPoolNumbers();
      } else {
        showToast(response.data?.error || 'Failed to assign number', 'error');
      }
    } catch (error) {
      showToast('Failed to assign number', 'error');
    }
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

  // Helper to get user name from email
  const getUserName = (email) => {
    const found = users.find(u => u.email === email);
    return found?.user_metadata?.full_name || email?.split('@')[0] || email;
  };

  if (userRole !== 'admin' && userRole !== 'agent') {
    return (
      <div className="glass-card p-8 text-center text-rose-600 dark:text-rose-400">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg ${
          toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400' 
            : 'bg-rose-50 dark:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400'
        } backdrop-blur-sm max-w-md shadow-lg animate-slide-up`}>
          {toast.message}
        </div>
      )}

      {/* ===== NUMBER POOL MANAGEMENT ===== */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="w-5 h-5" /> Number Pool
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {poolNumbers.length} numbers available in pool
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddNumberModal(true)} 
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Number
            </button>
            <button 
              onClick={loadPoolNumbers} 
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {poolLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="table-container overflow-x-auto">
            <div className="min-w-[700px]">
              <table>
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Number</th>
                    <th className="px-4 py-3 text-left">Range</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-left">Term</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {poolNumbers.length > 0 ? poolNumbers.map((num) => (
                    <tr key={num.id}>
                      <td className="px-4 py-3 font-mono text-sm text-slate-900 dark:text-white">{num.number}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <span className="number-range-badge">{num.range_name || 'Pool'}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">${num.rate?.toFixed(3) || '0.000'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{num.term || '7/1'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge-${num.allocated_to ? 'success' : 'info'}`}>
                          {num.allocated_to ? 'Assigned' : 'Available'}
                        </span>
                        {num.allocated_to && (
                          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                            → {getUserName(num.allocated_to)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {!num.allocated_to && (
                            <select 
                              onChange={(e) => handleAssignToUser(num.id, e.target.value)}
                              className="select-field text-xs py-1 w-32"
                              defaultValue=""
                            >
                              <option value="">Assign to...</option>
                              {users
                                .filter(u => u.id !== user?.id && !u.banned)
                                .map(u => (
                                  <option key={u.id} value={u.email}>
                                    {u.user_metadata?.full_name || u.email?.split('@')[0] || u.email}
                                  </option>
                                ))
                              }
                            </select>
                          )}
                          <button 
                            onClick={() => handleRemoveFromPool(num.id)}
                            className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        No numbers in pool. Add numbers using the "Add Number" button.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===== USER MANAGEMENT ===== */}
      <div className="glass-card px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" /> User Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total: {users.length} users</p>
          {error && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>}
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Create User
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 sm:w-64">
          <input 
            type="text" 
            value={searchTerm} 
            onChange={handleSearch} 
            className="input-field pl-4 text-sm" 
            placeholder="Search users..." 
          />
        </div>
        <button onClick={loadUsers} className="btn-secondary text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
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
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white text-sm">
                            {metadata.full_name || 'User'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      {userRole === 'admin' ? (
                        <select 
                          value={role} 
                          onChange={(e) => handleRoleChange(u.id, e.target.value)} 
                          className="select-field w-24 text-xs py-1"
                          disabled={isCurrentUser}
                        >
                          <option value="admin">Admin</option>
                          <option value="agent">Agent</option>
                          <option value="user">User</option>
                        </select>
                      ) : (
                        <span className={`badge-${role === 'admin' ? 'danger' : role === 'agent' ? 'warning' : 'info'}`}>{role}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${isBanned ? 'danger' : 'success'}`}>
                        {isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!isBanned && userRole === 'admin' && !isCurrentUser && (
                          <button onClick={() => handleBan(u.id)} className="p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-500/10">
                            <Ban className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </button>
                        )}
                        {isBanned && userRole === 'admin' && !isCurrentUser && (
                          <button onClick={() => handleUnban(u.id)} className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </button>
                        )}
                        {userRole === 'admin' && !isCurrentUser && (
                          <button onClick={() => handleDelete(u.id)} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10">
                            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    {error ? 'Error loading users. Please refresh.' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Showing {startIndex + 1} to {Math.min(startIndex + perPage, filteredUsers.length)} of {filteredUsers.length}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1} 
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"
            >
              First
            </button>
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
              disabled={currentPage === 1} 
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageNumbers().map(page => (
              <button 
                key={page} 
                onClick={() => setCurrentPage(page)} 
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  currentPage === page 
                    ? 'bg-brand-600 text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
              disabled={currentPage === totalPages} 
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages} 
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* ===== CREATE USER MODAL ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
                <input 
                  type="email" 
                  required 
                  value={newUser.email} 
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                  className="input-field" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password *</label>
                <input 
                  type="password" 
                  required 
                  minLength="6" 
                  value={newUser.password} 
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                  className="input-field" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <input 
                  type="text" 
                  value={newUser.full_name} 
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} 
                  className="input-field" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                <select 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})} 
                  className="select-field"
                >
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Create</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ADD NUMBER MODAL ===== */}
      {showAddNumberModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Number to Pool</h3>
              <button onClick={() => setShowAddNumberModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Single Number */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Add Single Number</h4>
                <form onSubmit={handleAddNumber} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Number *</label>
                    <input 
                      type="text" 
                      required 
                      value={newNumber.number} 
                      onChange={(e) => setNewNumber({...newNumber, number: e.target.value})} 
                      className="input-field text-sm" 
                      placeholder="e.g., 447441837649" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Range Name</label>
                    <input 
                      type="text" 
                      value={newNumber.range_name} 
                      onChange={(e) => setNewNumber({...newNumber, range_name: e.target.value})} 
                      className="input-field text-sm" 
                      placeholder="e.g., UK 01" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Rate ($)</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        value={newNumber.rate} 
                        onChange={(e) => setNewNumber({...newNumber, rate: parseFloat(e.target.value) || 0})} 
                        className="input-field text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Term</label>
                      <input 
                        type="text" 
                        value={newNumber.term} 
                        onChange={(e) => setNewNumber({...newNumber, term: e.target.value})} 
                        className="input-field text-sm" 
                        placeholder="7/1" 
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Number
                  </button>
                </form>
              </div>

              {/* Bulk Numbers */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Bulk Add Numbers</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Paste Numbers (one per line)</label>
                  <textarea 
                    value={bulkNumbers} 
                    onChange={(e) => setBulkNumbers(e.target.value)} 
                    className="input-field text-sm min-h-[100px] font-mono" 
                    placeholder="447441837649&#10;447441837650&#10;447441837651"
                  />
                </div>
                <button 
                  onClick={handleBulkAddNumbers} 
                  className="btn-success w-full text-sm flex items-center justify-center gap-2 mt-3"
                >
                  <Upload className="w-4 h-4" /> Bulk Add Numbers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
