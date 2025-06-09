// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import productReducer from './slices/ProductSlice';
import cartReducer from './slices/CartSlice';

// 🔁 Load from localStorage
const loadCartFromLocalStorage = () => {
  try {
    const serializedState = localStorage.getItem('cartItems');
    return serializedState ? { items: JSON.parse(serializedState) } : undefined;
  } catch (e) {
    console.error("Could not load cart from localStorage", e);
    return undefined;
  }
};

export const store = configureStore({
  reducer: {
    user: userReducer,
    products: productReducer,
    cart: cartReducer,
  },
   preloadedState: {
    cart: loadCartFromLocalStorage() || undefined,
  },
});



// 💾 Save to localStorage on every cart change
store.subscribe(() => {
  try {
    const state = store.getState();
    const serializedCart = JSON.stringify(state.cart.items);
    localStorage.setItem('cartItems', serializedCart);
  } catch (e) {
    console.error("Could not save cart to localStorage", e);
  }
});


