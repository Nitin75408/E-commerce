// redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setCartItem } from './CartSlice';
import axios from 'axios';


export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (token, thunkAPI) => {
    try {
      const {data} = await axios.get('/api/user/data', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  user: null,
  userData: null,
  isSeller: false,
   hasFetched: false,
   status : "idle",
   refreshOrders: false,
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
    setRefreshOrders: (state, action) => {
      state.refreshOrders = action.payload; // ✅ true or false
    },
   
  },
   extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.userData = action.payload;
        state.status = 'succeeded';
        state.hasFetched = true; // ✅ mark as fetched
        state.user = state.userData.user._id;
      })
      .addCase(fetchUserData.rejected, (state) => {
        state.status = 'failed';
        state.hasFetched = false;
      });
  },

});

export const { setClerkUser, setUserData, setIsSeller,  setRefreshOrders } = userSlice.actions;
export default userSlice.reducer;
