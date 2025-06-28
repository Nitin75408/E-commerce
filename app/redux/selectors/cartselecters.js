import { createSelector } from 'reselect';

// Base selectors - these are simple and fast
const selectCartItems = (state) => state.cart.items;
const selectProducts = (state) => state.products.items;

// Memoized selector for cart count
export const selectCartCount = createSelector(
  [selectCartItems],
  (cartItems) => {
    return Object.values(cartItems).reduce((acc, qty) => acc + qty, 0);
  }
);

// Memoized selector for cart amount
export const selectCartAmount = createSelector(
  [selectCartItems, selectProducts],
  (cartItems, products) => {
    return Object.entries(cartItems).reduce((acc, [id, qty]) => {
      const product = (products || []).find(p => p && p._id === id);
      return product ? acc + product.offerPrice * qty : acc;
    }, 0);
  }
);

// Additional useful selectors
export const selectCartItemsCount = createSelector(
  [selectCartItems],
  (cartItems) => Object.keys(cartItems).length
);

export const selectCartItemsArray = createSelector(
  [selectCartItems],
  (cartItems) => Object.entries(cartItems).map(([id, qty]) => ({ id, qty }))
);