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
const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    hasFetched: false,
    status: 'idle',
    error: null,
  },
  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload;
    },
  },
  // ✅ FIXED: `extraReducers` should be outside `reducers`
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.hasFetched = true;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.hasFetched = false;
      });
  },
});

export const { setProducts } = productSlice.actions;
export default productSlice.reducer;

