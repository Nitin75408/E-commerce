'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/app/redux/store';
import ReduxResetWatcher from './ReduxResetWatcher';


export default function AppProvider({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ReduxResetWatcher />   
        {children}
      </PersistGate>
    </Provider>
  );
}