import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/product/list");
      return res.data.products;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchFilteredProducts = createAsyncThunk(
  "products/fetchFilteredProducts",
  async (filters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.categories && filters.categories.length > 0) {
        params.append('categories', filters.categories.join(','));
      }
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice);

      const res = await axios.get(`/api/product/list?${params.toString()}`);
      return {
        products: res.data.products,
        totalPages: res.data.totalPages
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchSellerProducts = createAsyncThunk(
  "products/fetchSellerProducts",
  async (page, { rejectWithValue, getState }) => {
    try {
      const token = await getState().user.token; // You might need to store token in user state
      const res = await axios.get(`/api/product/seller-list?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return {
        products: res.data.products,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  items: [], // All products (for home page, all-products page)
  sellerItems: [], // Seller's products only
  hasFetched: false,
  sellerHasFetched: false,
  status: 'idle',
  sellerStatus: 'idle',
  error: null,
  sellerError: null,
  totalPages: 1,
  sellerTotalPages: 1,
  currentPage: 1,
  lastFetched: null,
   
};

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [], // All products (for home page, all-products page)
    sellerItems: [], // Seller's products only
    hasFetched: false,
    sellerHasFetched: false,
    status: 'idle',
    sellerStatus: 'idle',
    error: null,
    sellerError: null,
    totalPages: 1,
    sellerTotalPages: 1,
    currentPage: 1,
    lastFetched: null,
  },
  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload;
      state.hasFetched = true;
      state.status = 'succeeded';
      state.lastFetched = Date.now();
    },
    setSellerProducts: (state, action) => {
      // Handle both single products array and object with metadata
      if (Array.isArray(action.payload)) {
        state.sellerItems = action.payload;
      } else {
        state.sellerItems = action.payload.products || action.payload;
        state.sellerTotalPages = action.payload.totalPages || state.sellerTotalPages;
        state.currentPage = action.payload.currentPage || state.currentPage;
      }
      state.sellerHasFetched = true;
      state.sellerStatus = 'succeeded';
    },
    removeProduct: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item._id !== productId);
      state.sellerItems = state.sellerItems.filter(item => item._id !== productId);
    },
    clearProducts: (state) => {
      state.items = [];
      state.hasFetched = false;
      state.status = 'idle';
      state.error = null;
      state.lastFetched = null;
    },
    clearSellerProducts: (state) => {
      state.sellerItems = [];
      state.sellerHasFetched = false;
      state.sellerStatus = 'idle';
      state.sellerError = null;
    },
    resetLastFetched: (state) => {
      state.lastFetched = null;
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // All products
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.hasFetched = true;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.hasFetched = false;
      })
      .addCase(fetchFilteredProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFilteredProducts.fulfilled, (state, action) => {
        state.items = action.payload.products;
        state.totalPages = action.payload.totalPages;
        state.status = 'succeeded';
        state.hasFetched = true;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchFilteredProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Seller products
      .addCase(fetchSellerProducts.pending, (state) => {
        state.sellerStatus = 'loading';
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.sellerItems = action.payload.products;
        state.sellerTotalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.sellerStatus = 'succeeded';
        state.sellerHasFetched = true;
        state.sellerError = null;
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.sellerStatus = 'failed';
        state.sellerError = action.payload;
      })
      // Handle rehydration from persistence
      .addMatcher(
        (action) => action.type === 'persist/REHYDRATE',
        (state) => {
          // Reset lastFetched when store rehydrates to ensure fresh data on page load
          state.lastFetched = null;
        }
      );
  },
});

export const { setProducts, setSellerProducts, removeProduct, clearProducts, clearSellerProducts, resetLastFetched, reset } = productSlice.actions;
export default productSlice.reducer;

