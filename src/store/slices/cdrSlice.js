import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  records: [],
  filteredRecords: [],
  filters: {
    fromDate: '',
    toDate: '',
    keyword: '',
    destination: '',
    range: '',
    client: '',
  },
  summary: {
    totalMessages: 0,
    myPayout: 0,
    profit: 0,
  },
  loading: false,
  error: null,
  total: 0,
  page: 1,
  perPage: 25,
};

const calculateSummary = (records) => {
  return {
    totalMessages: records.length,
    myPayout: records.reduce((sum, r) => sum + (parseFloat(r.rate) || 0), 0),
    profit: records.reduce((sum, r) => sum + (parseFloat(r.rate) || 0), 0),
  };
};

const cdrSlice = createSlice({
  name: 'cdr',
  initialState,
  reducers: {
    setRecords: (state, action) => {
      state.records = action.payload.records || [];
      state.total = action.payload.total || 0;
      state.page = action.payload.page || 1;
      state.perPage = action.payload.perPage || 25;
      state.filteredRecords = state.records;
      state.summary = calculateSummary(state.records);
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
      // Client-side filtering for immediate feedback
      let filtered = [...state.records];
      if (state.filters.fromDate) {
        const from = new Date(state.filters.fromDate);
        filtered = filtered.filter(r => new Date(r.created_at || r.timestamp) >= from);
      }
      if (state.filters.toDate) {
        const to = new Date(state.filters.toDate);
        to.setHours(23, 59, 59);
        filtered = filtered.filter(r => new Date(r.created_at || r.timestamp) <= to);
      }
      if (state.filters.keyword) {
        const kw = state.filters.keyword.toLowerCase();
        filtered = filtered.filter(r => (r.message || '').toLowerCase().includes(kw));
      }
      if (state.filters.destination) {
        filtered = filtered.filter(r => (r.destination || '').includes(state.filters.destination));
      }
      if (state.filters.range && state.filters.range !== 'All ranges') {
        filtered = filtered.filter(r => r.range_name === state.filters.range);
      }
      if (state.filters.client && state.filters.client !== 'All clients') {
        filtered = filtered.filter(r => r.allocated_to === state.filters.client);
      }
      state.filteredRecords = filtered;
      state.summary = calculateSummary(filtered);
    },
    resetFilters: (state) => {
      state.filters = { fromDate: '', toDate: '', keyword: '', destination: '', range: '', client: '' };
      state.filteredRecords = state.records;
      state.summary = calculateSummary(state.records);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setRecords, setFilter, resetFilters, setLoading, setError } = cdrSlice.actions;
export default cdrSlice.reducer;
