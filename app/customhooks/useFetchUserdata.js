// customhooks/useFetchUserData.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData, setIsSeller } from '@/app/redux/slices/userSlice';
import { useAuth, useUser } from '@clerk/nextjs';

export const useFetchUserData = () => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const {user} = useUser();
  const hasFetched = useSelector((state) => state.user.hasFetched);
  useEffect(() => {
    const fetchData = async () => {
       if(user){
        if(user.publicMetadata.role==='seller'){
            dispatch(setIsSeller(true))
        }
       }
      if (hasFetched) return; // ✅ prevent refetch
      const token = await getToken();
      if (!token) return;
      dispatch(fetchUserData(token));
    };

    fetchData();
  }, [hasFetched]);
};