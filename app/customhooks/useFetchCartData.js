import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCartData } from '../redux/slices/CartSlice';
import { useAuth } from '@clerk/nextjs';

export const useFetchCartData = () => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const hasFetched = useSelector((state) => state.cart.hasFetched);

  useEffect(() => {
    const fetchData = async () => {
      console.log("hasFetched:", hasFetched);
      if (hasFetched) return;

      const token = await getToken();
      console.log("Token:", token);
      if (!token) return;

      dispatch(fetchCartData(token)).then((res) => {
        console.log('Fetched cart data result:', res);
      });
    };

    fetchData();
  }, [hasFetched, getToken, dispatch]);
};