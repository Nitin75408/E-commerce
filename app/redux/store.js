
'use client';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from 'redux';
import userReducer from './slices/userSlice';
import productReducer from './slices/ProductSlice';
import cartReducer from './slices/CartSlice';
import storage from './customEngine';

// Combine reducers
const rootReducer = combineReducers({
  user: userReducer,
  products: productReducer,
  cart: cartReducer,
});

// Set up persist config
const persistConfig = {
  key: 'root',
  storage: storage,
  whitelist: [ 'cart','user','products'], // only persist these slices
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store
export const store = configureStore({
  reducer: persistedReducer,
   devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
     serializableCheck: {
    ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
  },
    }),
});

// Create persistor
export const persistor = persistStore(store);


