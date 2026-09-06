import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  clients: [],
  filteredClients: [],
  searchTerm: '',
  pageSize: 25,
  currentPage: 1,
  loading: false,
  error: null,
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setClients: (state, action) => {
      state.clients = action.payload || [];
      state.filteredClients = action.payload || [];
      state.error = null;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      state.currentPage = 1;
      state.filteredClients = state.clients.filter(c =>
        c.name?.toLowerCase().includes(action.payload.toLowerCase()) ||
        c.email?.toLowerCase().includes(action.payload.toLowerCase())
      );
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setClients,
  setSearchTerm,
  setPageSize,
  setCurrentPage,
  setLoading,
  setError,
} = clientsSlice.actions;

export default clientsSlice.reducer;
