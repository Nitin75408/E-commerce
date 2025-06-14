import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '@/app/redux/slices/ProductSlice';
import { useAuth } from '@clerk/nextjs';

export const useFetchProductData = () => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const hasFetched = useSelector((state) => state.products.hasFetched);

  useEffect(() => {
    const fetchData = async () => {
      console.log("h");
        console.log(hasFetched)
      if (hasFetched) return; // ✅ Don't fetch again
    
      const token = await getToken();
      console.log(token);
      if (!token) return;
      dispatch(fetchProducts(token));
    };

    fetchData();
  }, [hasFetched]);
};