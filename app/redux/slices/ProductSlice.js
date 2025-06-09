import { createSlice } from '@reduxjs/toolkit';
import { productsDummyData } from '@/assets/assets';

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: productsDummyData,
  },
  reducers: {
    setProducts: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { setProducts } = productSlice.actions;
export default productSlice.reducer;
