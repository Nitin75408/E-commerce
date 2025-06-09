export const selectCartCount = (state) => {
  return Object.values(state.cart.items).reduce((acc, qty) => acc + qty, 0);
};

export const selectCartAmount = (state, products) => {
  return Object.entries(state.cart.items).reduce((acc, [id, qty]) => {
    const product = products.find(p => p._id === id);
    return product ? acc + product.offerPrice * qty : acc;
  }, 0);
};