import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  FileSpreadsheet,
  Trash2,
  X,
  UserPlus,
} from 'lucide-react';
import {
  setNumbers,
  setFilter,
  clearFilters,
  toggleNumberSelection,
  toggleSelectAll,
  setLoading,
  setError,
} from '../store/slices/numbersSlice';
import { numbersAPI, adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MyNumbers = () => {
  const dispatch = useDispatch();
  const { numbers, filteredNumbers, selectedNumbers, filters, loading, error, total } = useSelector((state) => state.numbers);
  const { user } = useSelector((state) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [clientNames, setClientNames] = useState({});
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  useEffect(() => {
    loadNumbers();
    loadClients();
  }, []);

  const loadNumbers = async () => {
    dispatch(setLoading(true));
    try {
      const response = await numbersAPI.getMyNumbers();
      if (response.data.success) {
        const numbersData = response.data.data.numbers || [];
        dispatch(setNumbers(numbersData));
      } else {
        dispatch(setError(response.data.error || 'Failed to load numbers'));
      }
    } catch (error) {
      dispatch(setError(error.response?.data?.error || error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await adminAPI.getUsers(1, 100);
      if (response.data.success) {
        const users = response.data.data.users || [];
        const formatted = users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
          role: u.user_metadata?.role || 'user',
        }));
        setClients(formatted);
        const nameMap = {};
        formatted.forEach(u => { nameMap[u.email] = u.name; });
        setClientNames(nameMap);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const getClientName = (email) => {
    if (!email) return 'Available';
    return clientNames[email] || email.split('@')[0] || 'Assigned';
  };

  const handleAssign = async () => {
    if (!selectedClient || selectedNumbers.length === 0) return;
    try {
      const numbersToAssign = numbers.filter(num => selectedNumbers.includes(num.id)).map(num => num.number);
      const response = await numbersAPI.allocate({
        numbers: numbersToAssign,
        range_name: 'Assigned',
        rate: 0.01,
        term: '7/1',
        user_email: selectedClient,
      });
      if (response.data.success) {
        showToast(`Assigned ${numbersToAssign.length} numbers to ${selectedClient}`, 'success');
        setShowAssignModal(false);
        setSelectedClient('');
        loadNumbers();
      } else {
        showToast(response.data.error || 'Assignment failed', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.error || error.message, 'error');
    }
  };

  const handleReturn = async () => {
    if (selectedNumbers.length === 0) return;
    if (!confirm(`Return ${selectedNumbers.length} numbers?`)) return;
    try {
      let successCount = 0;
      for (const numId of selectedNumbers) {
        const num = numbers.find(n => n.id === numId);
        if (num && num.allocated_to) {
          try {
            await numbersAPI.deallocate(numId);
            successCount++;
          } catch (e) { console.error(e); }
        }
      }
      if (successCount > 0) {
        showToast(`Returned ${successCount} numbers`, 'success');
        loadNumbers();
      } else {
        showToast('Failed to return numbers', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.error || error.message, 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg ${type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400'} backdrop-blur-sm max-w-md shadow-lg animate-slide-up`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const getRanges = () => {
    const ranges = new Set();
    numbers.forEach(n => { if (n.range_name) ranges.add(n.range_name); });
    return ['All ranges', ...Array.from(ranges)];
  };

  const getClients = () => {
    const clientsSet = new Set();
    numbers.forEach(n => { if (n.allocated_to) clientsSet.add(n.allocated_to); });
    return ['All clients', ...Array.from(clientsSet)];
  };

  const totalPages = Math.ceil(filteredNumbers.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedNumbers = filteredNumbers.slice(startIndex, startIndex + perPage);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="glass-card p-8 text-center text-rose-600 dark:text-rose-400">{error}</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="glass-card px-4 sm:px-6 py-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Total: <span className="text-slate-900 dark:text-white font-medium">{total}</span> numbers
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <select value={filters.range} onChange={(e) => { dispatch(setFilter({ key: 'range', value: e.target.value })); setCurrentPage(1); }} className="select-field text-sm">
            {getRanges().map(r => <option key={r} value={r === 'All ranges' ? '' : r}>{r}</option>)}
          </select>
          <select value={filters.client} onChange={(e) => { dispatch(setFilter({ key: 'client', value: e.target.value })); setCurrentPage(1); }} className="select-field text-sm">
            {getClients().map(c => <option key={c} value={c === 'All clients' ? '' : c}>{c}</option>)}
          </select>
          <select value={filters.allocation} onChange={(e) => { dispatch(setFilter({ key: 'allocation', value: e.target.value })); setCurrentPage(1); }} className="select-field text-sm">
            <option value="">Allocation</option>
            <option value="All">All</option>
            <option value="Assigned">Assigned</option>
            <option value="Available">Available</option>
          </select>
          <input type="text" value={filters.prefix} onChange={(e) => { dispatch(setFilter({ key: 'prefix', value: e.target.value })); setCurrentPage(1); }} className="input-field text-sm" placeholder="Number starts..." />
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={() => { dispatch(clearFilters()); setCurrentPage(1); }} className="btn-secondary text-sm">Reset</button>
          <button onClick={loadNumbers} className="btn-secondary text-sm flex items-center gap-2 ml-auto"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">{selectedNumbers.length} selected</span>
          <button onClick={() => setShowAssignModal(true)} disabled={selectedNumbers.length === 0} className="btn-success text-sm flex items-center gap-2 disabled:opacity-50"><UserPlus className="w-4 h-4" /><span className="hidden sm:inline">Assign</span></button>
          <button onClick={handleReturn} disabled={selectedNumbers.length === 0} className="btn-danger text-sm flex items-center gap-2 disabled:opacity-50"><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">Return</span></button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="select-field w-20 text-sm">
            <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
          <button className="btn-outline text-sm flex items-center gap-1 px-2"><Copy className="w-4 h-4" /></button>
          <button className="btn-outline text-sm flex items-center gap-1 px-2"><FileText className="w-4 h-4" /></button>
          <button className="btn-outline text-sm flex items-center gap-1 px-2"><FileSpreadsheet className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container overflow-x-auto">
        <div className="min-w-[600px]">
          <table>
            <thead>
              <tr>
                <th className="px-3 sm:px-4 py-3 w-10"><input type="checkbox" checked={selectedNumbers.length === filteredNumbers.length && filteredNumbers.length > 0} onChange={() => dispatch(toggleSelectAll())} className="cursor-pointer" /></th>
                <th className="px-3 sm:px-4 py-3 text-left">Range</th>
                <th className="px-3 sm:px-4 py-3 text-left">Number</th>
                <th className="px-3 sm:px-4 py-3 text-right">Rate</th>
                <th className="px-3 sm:px-4 py-3 text-left">Term</th>
                <th className="px-3 sm:px-4 py-3 text-left">Assigned To</th>
                <th className="px-3 sm:px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedNumbers.length > 0 ? paginatedNumbers.map((num) => {
                const assignedTo = num.allocated_to ? getClientName(num.allocated_to) : 'Available';
                const isAssigned = !!num.allocated_to;
                return (
                  <tr key={num.id}>
                    <td><input type="checkbox" checked={selectedNumbers.includes(num.id)} onChange={() => dispatch(toggleNumberSelection(num.id))} /></td>
                    <td><div className="font-medium text-slate-900 dark:text-white text-sm">{num.range_name || 'Unnamed'}</div></td>
                    <td className="font-mono text-sm text-slate-700 dark:text-slate-300">{num.number}</td>
                    <td className="text-right text-emerald-600 dark:text-emerald-400">${num.rate?.toFixed(3) || '0.000'}</td>
                    <td>{num.term || '7/1'}</td>
                    <td><span className={`text-sm ${isAssigned ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>{assignedTo}</span></td>
                    <td><span className={`badge-${isAssigned ? 'success' : 'info'}`}>{isAssigned ? 'Assigned' : 'Available'}</span></td>
                  </tr>
                );
              }) : <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No numbers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Showing {startIndex + 1} to {Math.min(startIndex + perPage, filteredNumbers.length)} of {filteredNumbers.length}</div>
          <div className="flex flex-wrap items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50">First</button>
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"><ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" /></button>
            <span className="text-sm text-slate-600 dark:text-slate-300">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"><ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50">Last</button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Assign Numbers</h3>
              <button onClick={() => { setShowAssignModal(false); setSelectedClient(''); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50"><X className="w-5 h-5 text-slate-500 dark:text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Assign {selectedNumbers.length} numbers to:</p>
            <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="select-field w-full mb-4">
              <option value="">Select a client...</option>
              {clients.filter(c => c.role !== 'admin').map(client => <option key={client.id} value={client.email}>{client.name} ({client.email})</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={handleAssign} disabled={!selectedClient} className="btn-primary flex-1 disabled:opacity-50"><UserPlus className="w-4 h-4" /> Assign</button>
              <button onClick={() => { setShowAssignModal(false); setSelectedClient(''); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNumbers;
