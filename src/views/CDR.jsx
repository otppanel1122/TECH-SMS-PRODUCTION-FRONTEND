import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshCw, ChevronLeft, ChevronRight, Download, Filter, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { setRecords, setFilter, resetFilters, setLoading, setError } from '../store/slices/cdrSlice';
import { cdrAPI, numbersAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CDR = () => {
  const dispatch = useDispatch();
  const { records, filteredRecords, filters, summary, loading, error, total, page, perPage } = useSelector((state) => state.cdr);
  const { user } = useSelector((state) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPageState, setPerPageState] = useState(25);
  const [showFilters, setShowFilters] = useState(true);
  const [ranges, setRanges] = useState(['All ranges']);
  const [clients, setClients] = useState(['All clients']);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [myNumbers, setMyNumbers] = useState([]);

  useEffect(() => {
    loadFilterOptions();
    loadRecords(1, perPageState);
  }, []);

  const toggleMessage = (index) => {
    setExpandedMessages(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const loadFilterOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const response = await numbersAPI.getMyNumbers();
      if (response.data.success) {
        const numbers = response.data.data.numbers || [];
        setMyNumbers(numbers);
        const uniqueRanges = new Set();
        const uniqueClients = new Set();
        numbers.forEach(num => {
          if (num.range_name) uniqueRanges.add(num.range_name);
          if (num.allocated_to) uniqueClients.add(num.allocated_to);
        });
        setRanges(['All ranges', ...Array.from(uniqueRanges)]);
        setClients(['All clients', ...Array.from(uniqueClients)]);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const loadRecords = useCallback(async (pageNum = 1, perPageVal = 25) => {
    setIsRefreshing(true);
    dispatch(setLoading(true));
    try {
      // First, fetch all CDR records from the API
      const allRecordsResponse = await cdrAPI.getAllRecords();
      
      if (allRecordsResponse.data.success) {
        let allRecords = allRecordsResponse.data.data.records || [];
        
        // Filter records by user's numbers on the frontend
        const myNumberList = myNumbers.length > 0 
          ? myNumbers.map(n => n.number) 
          : [];
        
        // If we have user's numbers, filter CDR records to only show those
        let filteredRecords = allRecords;
        if (myNumberList.length > 0) {
          filteredRecords = allRecords.filter(record => 
            myNumberList.includes(record.sender_id) || 
            myNumberList.some(num => record.message?.includes(num))
          );
        }
        
        // Apply additional filters
        if (filters.fromDate) {
          const fromDate = new Date(filters.fromDate);
          filteredRecords = filteredRecords.filter(r => 
            new Date(r.created_at || r.timestamp) >= fromDate
          );
        }
        if (filters.toDate) {
          const toDate = new Date(filters.toDate);
          toDate.setHours(23, 59, 59);
          filteredRecords = filteredRecords.filter(r => 
            new Date(r.created_at || r.timestamp) <= toDate
          );
        }
        if (filters.range && filters.range !== 'All ranges') {
          filteredRecords = filteredRecords.filter(r => r.range_name === filters.range);
        }
        if (filters.client && filters.client !== 'All clients') {
          filteredRecords = filteredRecords.filter(r => r.allocated_to === filters.client);
        }
        
        // Paginate the filtered results
        const totalRecords = filteredRecords.length;
        const startIndex = (pageNum - 1) * perPageVal;
        const paginatedRecords = filteredRecords.slice(startIndex, startIndex + perPageVal);
        
        dispatch(setRecords({
          records: paginatedRecords,
          total: totalRecords,
          page: pageNum,
          perPage: perPageVal,
        }));
      } else {
        dispatch(setError(allRecordsResponse.data.error || 'Failed to load CDR records'));
      }
    } catch (error) {
      dispatch(setError(error.response?.data?.error || error.message));
    } finally {
      setIsRefreshing(false);
      dispatch(setLoading(false));
    }
  }, [filters, myNumbers, dispatch]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilter({ key, value }));
    setCurrentPage(1);
    loadRecords(1, perPageState);
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setCurrentPage(1);
    loadRecords(1, perPageState);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    loadRecords(newPage, perPageState);
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPageState(newPerPage);
    setCurrentPage(1);
    loadRecords(1, newPerPage);
  };

  const totalPages = Math.ceil(total / perPageState);
  const startIndex = (currentPage - 1) * perPageState;
  const endIndex = Math.min(startIndex + perPageState, total);

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

  if (loading && !isRefreshing) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 dark:text-rose-400 mx-auto mb-4" />
        <p className="text-rose-600 dark:text-rose-400">{error}</p>
        <button onClick={() => loadRecords(currentPage, perPageState)} className="btn-primary mt-4">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="glass-card px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total: <span className="text-slate-900 dark:text-white font-medium">{total}</span> records
            {isRefreshing && <span className="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600 dark:border-brand-500"></span>}
          </p>
          {total === 0 && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">No records found.</p>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary text-sm flex items-center gap-2 w-full sm:w-auto justify-center">
          <Filter className="w-4 h-4" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass-card p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">From Date</label><input type="date" value={filters.fromDate || ''} onChange={(e) => handleFilterChange('fromDate', e.target.value)} className="input-field text-sm" /></div>
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">To Date</label><input type="date" value={filters.toDate || ''} onChange={(e) => handleFilterChange('toDate', e.target.value)} className="input-field text-sm" /></div>
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Range</label><select value={filters.range || ''} onChange={(e) => handleFilterChange('range', e.target.value)} className="select-field text-sm" disabled={isLoadingOptions}>{ranges.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Client</label><select value={filters.client || ''} onChange={(e) => handleFilterChange('client', e.target.value)} className="select-field text-sm" disabled={isLoadingOptions}>{clients.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button onClick={() => loadRecords(currentPage, perPageState)} disabled={isRefreshing} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> {isRefreshing ? 'Loading...' : 'Refresh'}</button>
            <button onClick={handleResetFilters} className="btn-secondary text-sm">Reset Filters</button>
            <button className="btn-outline text-sm flex items-center gap-2 ml-auto"><Download className="w-4 h-4" /> Export</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container overflow-x-auto">
        <div className="min-w-[700px]">
          <table>
            <thead>
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left">Timestamp</th>
                <th className="px-3 sm:px-4 py-3 text-left">Destination</th>
                <th className="px-3 sm:px-4 py-3 text-left">Sender</th>
                <th className="px-3 sm:px-4 py-3 text-left">Message</th>
                <th className="px-3 sm:px-4 py-3 text-right">Rate</th>
                <th className="px-3 sm:px-4 py-3 text-left hidden md:table-cell">Range</th>
                <th className="px-3 sm:px-4 py-3 text-left hidden lg:table-cell">Client</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? records.map((record, index) => {
                const isExpanded = expandedMessages[index] || false;
                const message = record.message || 'N/A';
                const isLong = message.length > 50;
                const displayMessage = isExpanded ? message : message.substring(0, 50) + (isLong && !isExpanded ? '...' : '');
                let timestamp = record.created_at || record.timestamp || 'N/A';
                try { const date = new Date(timestamp); if (!isNaN(date.getTime())) timestamp = date.toLocaleString(); } catch (e) {}
                return (
                  <tr key={index}>
                    <td className="px-3 sm:px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{timestamp}</td>
                    <td className="px-3 sm:px-4 py-3 font-mono text-sm text-slate-700 dark:text-slate-300">{record.destination || 'N/A'}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{record.sender_id || 'N/A'}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="max-w-[200px] sm:max-w-[300px]">
                        <div className="text-sm text-slate-700 dark:text-slate-300 break-words">{displayMessage}</div>
                        {isLong && <button onClick={() => toggleMessage(index)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline mt-1 flex items-center gap-1">{isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}</button>}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">${(record.rate || 0).toFixed(3)}</td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell"><span className="number-range-badge">{record.range_name || 'N/A'}</span></td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell">{record.allocated_to || 'N/A'}</td>
                  </tr>
                );
              }) : <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">No CDR records found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Showing {startIndex + 1} to {endIndex} of {total}</div>
          <div className="flex flex-wrap items-center gap-1">
            <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50">First</button>
            <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"><ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" /></button>
            {getPageNumbers().map(page => <button key={page} onClick={() => handlePageChange(page)} className={`px-2 py-1 rounded-lg text-xs font-medium ${currentPage === page ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>{page}</button>)}
            <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50"><ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" /></button>
            <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 disabled:opacity-50">Last</button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="glass-card p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center"><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total SMS</p><p className="text-lg font-bold text-slate-900 dark:text-white">{summary.totalMessages}</p></div>
          <div className="text-center"><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">My Payout</p><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${summary.myPayout.toFixed(3)}</p></div>
          <div className="text-center"><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Profit</p><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${summary.profit.toFixed(3)}</p></div>
          <div className="text-center"><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Currency</p><p className="text-lg font-bold text-slate-900 dark:text-white">USD</p></div>
        </div>
      </div>
    </div>
  );
};

export default CDR;
