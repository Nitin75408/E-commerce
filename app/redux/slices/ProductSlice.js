import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsDummyData } from '@/assets/assets';


export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (token, thunkAPI) => {
    try {
      const response = await axios.get('/api/product/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    hasFetched : false,
    status : "idle",


  },
  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload;
    },
    extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.hasFetched = true; // ✅ Mark as fetched
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.status = 'failed';
        state.hasFetched = false;
      });
  },
  },
});

export const { setProducts } = productSlice.actions;
export default productSlice.reducer;
