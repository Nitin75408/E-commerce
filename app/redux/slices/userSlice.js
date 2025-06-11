// redux/slices/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  userData: null,
  isSeller: true,
   token: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setClerkUser: (state, action) => {
      state.user = action.payload;
    },
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setIsSeller: (state, action) => {
      state.isSeller = action.payload
    },
  },

});

export const { setClerkUser, setUserData, setIsSeller } = userSlice.actions;
export default userSlice.reducer;
