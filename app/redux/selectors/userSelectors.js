import { createSelector } from 'reselect';

// Base selectors
const selectUserState = (state) => state.user;

// Memoized selectors for user
export const selectUser = createSelector(
  [selectUserState],
  (userState) => userState.user
);

export const selectUserData = createSelector(
  [selectUserState],
  (userState) => userState.userData
);

export const selectIsSeller = createSelector(
  [selectUserState],
  (userState) => userState.isSeller
);

export const selectUserStatus = createSelector(
  [selectUserState],
  (userState) => userState.status
);

export const selectUserHasFetched = createSelector(
  [selectUserState],
  (userState) => userState.hasFetched
);

export const selectOrderJustPlaced = createSelector(
  [selectUserState],
  (userState) => userState.orderJustPlaced
);

export const selectRefreshOrders = createSelector(
  [selectUserState],
  (userState) => userState.refreshOrders
);

// Derived selectors
export const selectUserName = createSelector(
  [selectUserData],
  (userData) => userData?.user?.name || 'User'
);

export const selectUserEmail = createSelector(
  [selectUserData],
  (userData) => userData?.user?.email || ''
);

export const selectUserAddresses = createSelector(
  [selectUserData],
  (userData) => userData?.addresses || []
); 