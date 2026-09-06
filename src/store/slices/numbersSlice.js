import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  numbers: [],
  filteredNumbers: [],
  selectedNumbers: [],
  filters: {
    range: '',
    client: '',
    allocation: '',
    prefix: '',
    rangeName: '',
  },
  loading: false,
  error: null,
  total: 0,
};

const numbersSlice = createSlice({
  name: 'numbers',
  initialState,
  reducers: {
    setNumbers: (state, action) => {
      state.numbers = action.payload;
      state.filteredNumbers = action.payload;
      state.total = action.payload.length;
      state.selectedNumbers = [];
    },
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
      state.selectedNumbers = [];
      state.filteredNumbers = state.numbers.filter(number => {
        const rangeMatch = !state.filters.range || number.range_name === state.filters.range;
        const clientMatch = !state.filters.client || number.allocated_to?.includes(state.filters.client);
        const allocationMatch = !state.filters.allocation ||
          (state.filters.allocation === 'Assigned' ? number.allocated_to :
          state.filters.allocation === 'Available' ? !number.allocated_to : true);
        const prefixMatch = !state.filters.prefix || number.number?.startsWith(state.filters.prefix);
        const rangeNameMatch = !state.filters.rangeName || number.range_name?.toLowerCase().includes(state.filters.rangeName.toLowerCase());
        return rangeMatch && clientMatch && allocationMatch && prefixMatch && rangeNameMatch;
      });
    },
    clearFilters: (state) => {
      state.filters = { range: '', client: '', allocation: '', prefix: '', rangeName: '' };
      state.filteredNumbers = state.numbers;
      state.selectedNumbers = [];
    },
    toggleNumberSelection: (state, action) => {
      const id = action.payload;
      const index = state.selectedNumbers.indexOf(id);
      if (index > -1) {
        state.selectedNumbers.splice(index, 1);
      } else {
        state.selectedNumbers.push(id);
      }
    },
    toggleSelectAll: (state) => {
      const allIds = state.filteredNumbers.map(n => n.id);
      const allSelected = allIds.every(id => state.selectedNumbers.includes(id));
      state.selectedNumbers = allSelected ? [] : allIds;
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
  setNumbers,
  setFilter,
  clearFilters,
  toggleNumberSelection,
  toggleSelectAll,
  setLoading,
  setError,
} = numbersSlice.actions;
export default numbersSlice.reducer;
