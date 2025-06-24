"use client";
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { reset as resetUser } from './slices/userSlice';
import { reset as resetCart } from './slices/CartSlice';

export default function ReduxResetWatcher() {
  const { user } = useUser();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) {
      dispatch(resetUser());
      dispatch(resetCart());
    }
  }, [user, dispatch]);

  return null;
} 