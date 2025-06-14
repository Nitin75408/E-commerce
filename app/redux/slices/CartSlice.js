// redux/slices/cartSlice.js
import { createSlice,createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';




export const fetchCartData = createAsyncThunk(
  'cart/fetchcartData',
  async (token, thunkAPI) => {
    try {
      const { data } = await axios.get('/api/cart/get', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        return data.cartItems; // ✅ only return cartItem, not full object
      } else {
        return thunkAPI.rejectWithValue(data.message || "Failed to fetch cart");
      }

    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: {}, // { [productId]: quantity }
  hasFetched : false,
  error : 'idle',
  status : 'idle',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const id = product._id;
      if (!id) return;
      state.items[id] = (state.items[id] || 0) + 1;
    },

    updateCartQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.items[id];
      } else {
        state.items[id] = quantity;
      }
    },

     setCartItem: (state,action) => {
      state.items = action.payload;
    },
  },


   extraReducers: (builder) => {
      builder
        .addCase(fetchCartData.pending, (state) => {
          state.status = 'loading';
        })
        .addCase(fetchCartData.fulfilled, (state, action) => {
          state.items = action.payload;
          state.status = 'succeeded';
          state.hasFetched = true;
        })
        .addCase(fetchCartData.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
          state.hasFetched = false;
        });
    },
});

export const { addToCart, updateCartQuantity,   setCartItem } = cartSlice.actions;
export default cartSlice.reducer;
