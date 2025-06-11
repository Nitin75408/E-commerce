// redux/slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: {}, // { [productId]: quantity }
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
});

export const { addToCart, updateCartQuantity,   setCartItem } = cartSlice.actions;
export default cartSlice.reducer;
