'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from '@/app/redux/store';
import ReduxResetWatcher from './ReduxResetWatcher';


export default function AppProvider({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ReduxResetWatcher />
        <Toaster />
        {children}
      </PersistGate>
    </Provider>
  );
}