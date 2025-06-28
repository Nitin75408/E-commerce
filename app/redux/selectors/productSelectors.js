import { createSelector } from 'reselect';

// Base selectors
const selectProductsState = (state) => state.products;
const selectProductsItems = (state) => state.products.items;
const selectSellerItems = (state) => state.products.sellerItems;

// Memoized selectors for products
export const selectAllProducts = createSelector(
  [selectProductsItems],
  (products) => products || []
);

export const selectSellerProducts = createSelector(
  [selectSellerItems],
  (sellerProducts) => sellerProducts || []
);

export const selectProductsStatus = createSelector(
  [selectProductsState],
  (productsState) => productsState.status
);

export const selectProductsError = createSelector(
  [selectProductsState],
  (productsState) => productsState.error
);

export const selectProductsHasFetched = createSelector(
  [selectProductsState],
  (productsState) => productsState.hasFetched
);

// Filtered product selectors
export const selectProductsByCategory = createSelector(
  [selectAllProducts, (state, category) => category],
  (products, category) => {
    if (!category) return products;
    return products.filter(product => product.category === category);
  }
);

export const selectProductsByPriceRange = createSelector(
  [selectAllProducts, (state, minPrice, maxPrice) => ({ minPrice, maxPrice })],
  (products, { minPrice, maxPrice }) => {
    if (!minPrice && !maxPrice) return products;
    return products.filter(product => {
      const price = product.offerPrice || product.price;
      if (minPrice && price < minPrice) return false;
      if (maxPrice && price > maxPrice) return false;
      return true;
    });
  }
);

// Product count selectors
export const selectTotalProductsCount = createSelector(
  [selectAllProducts],
  (products) => products.length
);

export const selectActiveProductsCount = createSelector(
  [selectAllProducts],
  (products) => products.filter(product => product.status === 'active').length
); 