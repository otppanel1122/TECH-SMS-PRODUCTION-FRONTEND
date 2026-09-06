import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Copy, FileText, FileSpreadsheet, Eye, Edit, Trash2 } from 'lucide-react';
import { setClients, setSearchTerm, setPageSize, setCurrentPage, setLoading, setError } from '../store/slices/clientsSlice';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Clients = () => {
  const dispatch = useDispatch();
  const { clients, filteredClients, searchTerm, pageSize, currentPage, loading, error } = useSelector((state) => state.clients);
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.user_metadata?.role || 'user';

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    dispatch(setLoading(true));
    try {
      const response = await adminAPI.getUsers(1, 100);
      if (response.data.success) {
        const users = response.data.data.users || [];
        const formatted = users.map(u => ({
          id: u.id,
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
          email: u.email || '',
          contact: u.user_metadata?.phone || '-',
          team: u.user_metadata?.team || '-',
          active: !u.banned,
          balance: u.user_metadata?.balance || 0,
          role: u.user_metadata?.role || 'user',
          createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
        }));
        dispatch(setClients(formatted));
      } else {
        dispatch(setError(response.data.error || 'Failed to load clients'));
      }
    } catch (error) {
      dispatch(setError(error.response?.data?.error || error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize);

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

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="glass-card p-8 text-center text-rose-600 dark:text-rose-400">{error}</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="glass-card px-4 sm:px-6 py-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Total: <span className="text-slate-900 dark:text-white font-medium">{clients.length}</span> clients</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input type="text" value={searchTerm} onChange={(e) => dispatch(setSearchTerm(e.target.value))} className="input-field pl-9 text-sm" placeholder="Search clients..." />
          </div>
          <select value={pageSize} onChange={(e) => dispatch(setPageSize(Number(e.target.value)))} className="select-field w-20 sm:w-24 text-sm">
            <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-outline text-sm flex items-center gap-1 px-3"><Copy className="w-4 h-4" /><span className="hidden sm:inline">Copy</span></button>
          <button className="btn-outline text-sm flex items-center gap-1 px-3"><FileText className="w-4 h-4" /><span className="hidden sm:inline">TXT</span></button>
          <button className="btn-outline text-sm flex items-center gap-1 px-3"><FileSpreadsheet className="w-4 h-4" /><span className="hidden sm:inline">CSV</span></button>
          <button onClick={loadClients} className="btn-secondary text-sm flex items-center gap-1 px-3"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="table-container overflow-x-auto">
        <div className="min-w-[600px]">
          <table>
            <thead>
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left">User</th>
                <th className="px-3 sm:px-4 py-3 text-left hidden sm:table-cell">Email</th>
                <th className="px-3 sm:px-4 py-3 text-left hidden md:table-cell">Contact</th>
                <th className="px-3 sm:px-4 py-3 text-left hidden lg:table-cell">Team</th>
                <th className="px-3 sm:px-4 py-3 text-right">Balance</th>
                <th className="px-3 sm:px-4 py-3 text-left">Status</th>
                {(userRole === 'admin' || userRole === 'agent') && <th className="px-3 sm:px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length > 0 ? paginatedClients.map((client) => (
                <tr key={client.id}>
                  <td className="px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs sm:text-sm font-medium">{client.name?.charAt(0).toUpperCase() || 'U'}</span>
                      </div>
                      <div><div className="font-medium text-slate-900 dark:text-white text-sm">{client.name}</div><div className="text-xs text-slate-500 sm:hidden">{client.email}</div></div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{client.email}</td>
                  <td className="px-3 sm:px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">{client.contact}</td>
                  <td className="px-3 sm:px-4 py-3 hidden lg:table-cell"><span className="badge-info">{client.team}</span></td>
                  <td className="px-3 sm:px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">${client.balance.toFixed(2)}</td>
                  <td className="px-3 sm:px-4 py-3"><span className={`badge-${client.active ? 'success' : 'danger'}`}>{client.active ? 'Active' : 'Inactive'}</span></td>
                  {(userRole === 'admin' || userRole === 'agent') && (
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50"><Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" /></button>
                        <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50"><Edit className="w-4 h-4 text-slate-500 dark:text-slate-400" /></button>
                        <button className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No clients found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredClients.length)} of {filteredClients.length}</div>
          <div className="flex flex-wrap items-center gap-1">
            <button onClick={() => dispatch(setCurrentPage(1))} disabled={currentPage === 1} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50">First</button>
            <button onClick={() => dispatch(setCurrentPage(Math.max(1, currentPage - 1)))} disabled={currentPage === 1} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            {getPageNumbers().map(page => <button key={page} onClick={() => dispatch(setCurrentPage(page))} className={`px-2 py-1 rounded-lg text-xs font-medium ${currentPage === page ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>{page}</button>)}
            <button onClick={() => dispatch(setCurrentPage(Math.min(totalPages, currentPage + 1)))} disabled={currentPage === totalPages} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => dispatch(setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50">Last</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
